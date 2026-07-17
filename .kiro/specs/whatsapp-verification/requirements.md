# Requirements Document

## Introduction

SafeSignal currently sends a verification link to a child's phone exclusively via Africa's Talking SMS when a parent runs the `ADD CHILD` command. This feature extends the verification flow so that the same link is **also** delivered through Twilio WhatsApp, in parallel with the existing SMS. The goal is to maximise the likelihood that the child receives and acts on the verification link, while keeping both delivery channels independent so that a failure in one never blocks the other.

No existing behaviour — parent commands, database models, Prisma schema, API endpoints, or the SMS flow — is changed.

---

## Glossary

- **ChildService**: NestJS injectable responsible for adding a child, generating a `VerificationToken`, and orchestrating all verification notifications.
- **WhatsappService**: NestJS injectable that wraps the Twilio client and handles all outbound WhatsApp communication.
- **SmsService**: NestJS injectable that wraps Africa's Talking and sends verification SMS to children. Remains untouched.
- **VerificationToken**: A short-lived, cryptographically random token stored in the database and embedded in the `verificationUrl`.
- **verificationUrl**: The full URL a child taps to complete verification, of the form `{FRONTEND_URL}/verify/{token}`.
- **FRONTEND_URL**: An environment variable already configured in the deployment environment that resolves to the canonical frontend base URL.
- **TWILIO_WHATSAPP_NUMBER**: An existing environment variable holding the Twilio sandbox or business WhatsApp sender in `whatsapp:+<number>` format.
- **WhatsApp verification message**: The formatted message containing the `verificationUrl` sent to the child over WhatsApp.

---

## Requirements

### Requirement 1: Send WhatsApp verification message

**User Story:** As a parent, I want the verification link to be sent to my child via WhatsApp as well as SMS, so that my child has a higher chance of receiving and tapping the link.

#### Acceptance Criteria

1. THE `WhatsappService` SHALL expose a public method `sendVerificationMessage(phoneNumber: string, verificationUrl: string): Promise<void>`.
2. WHEN `sendVerificationMessage` is called with a `phoneNumber` that does not already start with `whatsapp:`, THE `WhatsappService` SHALL prepend `whatsapp:+` to the number before passing it to the Twilio client as the destination; IF `phoneNumber` already starts with `whatsapp:`, THE `WhatsappService` SHALL use it as-is without double-prefixing.
3. WHEN `sendVerificationMessage` is called, THE `WhatsappService` SHALL use the value of `TWILIO_WHATSAPP_NUMBER` (loaded once in the constructor) as the `from` field, reusing the same singleton Twilio client used by `sendMessage`.
4. WHEN `sendVerificationMessage` is called, THE `WhatsappService` SHALL format the message body exactly as:

   ```
   🛡️ SafeSignal
   Your parent wants to protect this phone.
   Tap the link below to enable protection:
   <verificationUrl>
   This link expires in 30 minutes.
   ```

5. IF the Twilio API call inside `sendVerificationMessage` resolves successfully, THEN THE `WhatsappService` SHALL log `"WhatsApp sent successfully"` at the `log` level, including the destination number in the log context.
6. IF the Twilio API call inside `sendVerificationMessage` rejects with an error, THEN THE `WhatsappService` SHALL log `"WhatsApp failed"` at the `error` level (including `err.message`) and SHALL NOT re-throw the exception.
7. IF `phoneNumber` or `verificationUrl` is an empty string or nullish at the point `sendVerificationMessage` is entered, THEN THE `WhatsappService` SHALL log an `error`-level message describing the invalid input and SHALL return without calling the Twilio client; this error log SHALL be distinct from the `"WhatsApp failed"` message used for Twilio API errors.

---

### Requirement 2: Parallel dual-channel delivery in ChildService

**User Story:** As a system operator, I want SMS and WhatsApp notifications sent independently, so that a failure in one channel never prevents delivery through the other.

#### Acceptance Criteria

1. WHEN `ChildService.addChild` generates a `VerificationToken`, THE `ChildService` SHALL construct `verificationUrl` as `${process.env.FRONTEND_URL}/verify/${token}` before initiating any channel call.
2. IF `SmsService.sendVerificationSms` throws while `WhatsappService.sendVerificationMessage` has not yet been called, THEN THE `ChildService` SHALL still call `WhatsappService.sendVerificationMessage` with the correct `verificationUrl`.
3. IF `WhatsappService.sendVerificationMessage` throws while `SmsService.sendVerificationSms` has not yet been called, THEN THE `ChildService` SHALL still call `SmsService.sendVerificationSms` with the correct token.
4. WHEN both channel calls have completed or thrown, THE `ChildService` SHALL log `"Verification process completed"` at the `log` level, regardless of individual channel outcomes.
5. THE `ChildService` SHALL log `"Verification token generated"` at the `log` level after the `VerificationToken` is persisted to the database and before any channel call is attempted.
6. IF either channel call throws an exception, THE `ChildService` SHALL log the corresponding failure message (`"SMS failed"` or `"WhatsApp failed"`) at the `error` level before continuing to the next channel or to the completion log.

---

### Requirement 3: Logging contract for ChildService delivery

**User Story:** As an operator, I want consistent structured logs for every delivery attempt, so that I can diagnose failures without reading Twilio or Africa's Talking dashboards.

#### Acceptance Criteria

1. IF `SmsService.sendVerificationSms` resolves without throwing as observed by `ChildService`, THEN THE `ChildService` SHALL emit a `log`-level entry with the message `"SMS sent successfully"` including the destination phone number.
2. IF `SmsService.sendVerificationSms` throws an error as observed by `ChildService`, THEN THE `ChildService` SHALL emit an `error`-level entry with the message `"SMS failed"` including the destination phone number and the error message.
3. IF `WhatsappService.sendVerificationMessage` resolves without throwing as observed by `ChildService`, THEN THE `ChildService` SHALL emit a `log`-level entry with the message `"WhatsApp sent successfully"` including the destination phone number.
4. IF `WhatsappService.sendVerificationMessage` throws an error as observed by `ChildService`, THEN THE `ChildService` SHALL emit an `error`-level entry with the message `"WhatsApp failed"` including the destination phone number and the error message.

---

### Requirement 4: Dependency injection wiring

**User Story:** As a developer, I want `ChildService` to receive `WhatsappService` through NestJS dependency injection, so that the existing IoC patterns and testability are preserved.

#### Acceptance Criteria

1. THE `ChildModule` SHALL import `WhatsappModule` using `forwardRef(() => WhatsappModule)` to break the circular dependency that exists because `WhatsappModule` already imports `ChildModule` (or a module that transitively imports `ChildModule`); the corresponding `WhatsappModule` imports array SHALL also wrap any back-reference to `ChildModule` with `forwardRef`.
2. THE `ChildService` constructor SHALL declare `WhatsappService` as an injected dependency using `@Inject(forwardRef(() => WhatsappService))` alongside the existing `PrismaService` and `SmsService`.
3. THE `WhatsappModule` SHALL continue to export `WhatsappService`; no other change to `whatsapp.module.ts` is required beyond adding the `forwardRef` import wrapper described in criterion 1.
4. THE `SmsService` SHALL remain unmodified; no changes SHALL be made to `sms.service.ts` or `sms.module.ts`.

---

### Requirement 5: Preserve existing behaviour

**User Story:** As a developer, I want to ensure that no existing functionality is broken by this change, so that parent commands, DNS alerts, and API endpoints continue to work as before.

#### Acceptance Criteria

1. THE `WhatsappService.sendMessage(to: string, body: string): Promise<void>` method SHALL preserve its existing signature; WHEN called, it SHALL send a WhatsApp message to the `to` address using the Twilio client and SHALL log success or error exactly as it does today, with no change introduced by this feature.
2. THE `WhatsappService.parseCommand(body: string)` method SHALL preserve its existing signature and return type; IF the body does not match a known command pattern, it SHALL return `null` (or the existing sentinel value) unchanged.
3. THE `WhatsappService.formatBlockAlert` and `WhatsappService.getHelpMessage` methods SHALL remain callable with their existing parameter lists and return the same string shapes they return today.
4. THE `ChildService.addChild` method SHALL return `{ success: true, token }` after both delivery channels have been attempted, regardless of whether either or both channels threw an error during delivery.
5. THE `ChildModule` SHALL NOT alter the route handlers, guards, pipes, or interceptors on `ChildController`; the existing `POST /child` (or equivalent) endpoint SHALL remain identical.
6. THE system SHALL NOT add, rename, or remove any environment variable; the six variables `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `FRONTEND_URL`, `ATS_USERNAME`, and `ATS_API_KEY` SHALL be the complete set used by the modified modules.
