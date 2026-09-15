# People + Chat — integration contract

Final complete-My-World pass · 2026-09-12. How relationships and conversation
live inside My World. Companion to `my-world-product-completeness.md` and
`social-api-contract.md`. Prototype source: `src/components/world/`.

## 1. The rule: actions live with objects

There is no People tab and no Chat tab. A person is the object:

- find a person → **Search** (people rows: Life Ring, band, relationship chip)
- meet a person in the stream → their **name** in a Moment's readout
- a request arrives → **Notification** → Accept / Decline **in the row**
- any of these → the **person surface** (card): who, relationship, actions
- a connected person → **Message** → conversation
- conversation history → **Messages utility** → mini chat (desktop) / `/chat`

## 2. Relationship model (map to the real backend)

`friend · family · request-in · request-out · none`. Family is the current
relationship context (the live family tree's relations), distinct from Friends
and never the Ancestor Tree. Actions: Add Friend (none→request-out), Cancel,
Accept / Decline (request-in→friend/none), Remove (→none). Messaging is offered
to connected people (friend or family); a stranger's card carries no Message
action. **The exact live state machine must be verified against the backend**;
these are the design states the interface renders.

## 3. The person surface

A dialog card, not a page: Life Ring (band resolution, no tick), name, home,
`Circle band X · <relationship>`, ONE primary action + Message where permitted,
Remove as a quiet text control, and the sentence "The exact position in their
life is theirs to share." Friendship never raises life precision. In the live
product this grammar heads the existing profile page.

## 4. Messages, mini chat, full Chat

- **Messages** is a utility beside Search/Notifications/Account — never
  navigation. Its dot is message-unread only; the bell's dot is notification
  unread only. Two truths, two sources, no combined total.
- **Desktop (≥1024px):** choosing a conversation opens the ONE mini-chat dock,
  bottom-trailing: header (ring 24, name, open-in-Chat, minimise, close), log,
  input. Focus moves to the input on open and returns to the Messages control on
  close. It overlays the support column, never the stream; minimise is always
  available. No second dock, ever.
- **Phone/tablet (<1024px):** no dock. Messages → `/chat` (list → full-screen
  conversation, Back to the list, browser Back to My World with scroll kept).
- **Full Chat `/chat`:** the conversation surface of My World — same brand
  (mark → Home, context CHAT), same theme, same identity. Desktop: 300px list +
  conversation. `?c=<personId>` deep-links a conversation (person → Message).
  Chat is conversation first: no ages, no life coordinates, no telemetry in the
  thread; timestamps stay small (`HH:MM`).

## 5. Authentication — the P1 boundary

The live Chat is currently a separately hosted app with its own login. **That is
a deployment artifact, not the product.** The port must give Chat the shared
SYSTEMBOOM session (SSO / trusted session handoff) so an authenticated person
moves World → conversation with no second login, as the prototype demonstrates.
Do not invent client-side security; the prototype's identity is a mock.

## 6. Privacy

Band-only life data everywhere a person appears: search rows, person card, chat
identities, notification rows. Chat exposes no birth data. Health/Problem rules
unchanged. Only-me content never feeds anything a visitor sees.

## 7. Non-happy states (live-port definitions)

- **Loading:** the frame (brand, utilities) and any already-rendered content
  stay stable; lists load in place (conversations, notifications, search);
  never a full-screen spinner over the whole application.
- **Empty:** "No conversations yet. A friend's page is where one begins." ·
  "No messages in this conversation yet." · accepted Moments/notifications/search
  sentences. No illustrations, no fake content.
- **Errors:** plain sentence + Retry where real; a failed send keeps the text
  (accepted Notes pattern applies to chat sends); a failed image keeps the
  Moment's structure (stable ground + the photo's own words).
- **Offline/reconnect:** not simulated in the prototype. The live Chat should
  state connecting / disconnected / retrying against its real socket — contract
  to confirm with the backend.

## 8. What not to invent

A People/Chat navigation tab; multiple chat windows; typing indicators, read
receipts or presence the backend does not provide; red chat bubbles or red
selected conversations; life coordinates in conversation; a request centre; a
second unread total; person-level safety controls the backend lacks (classify,
don't fake).
