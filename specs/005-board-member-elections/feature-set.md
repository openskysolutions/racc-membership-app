# Board Member Elections: Feature Set

Working name: **Board Elections**. Client-facing feature list, grouped in the
order they'd be used through an election cycle. See
[research-and-plan.md](research-and-plan.md) for fit with the existing
codebase and the phased implementation plan.

## 1. Set Up an Election (board/admin)
- **Open positions**: board members/admins can create a position up for
  election (title, description, number of seats available).
- **Nominate candidates**: board members/admins add the chamber members
  being nominated for each position (name, business, optional short
  statement/bio).
- **Voting window**: set a voting opens/closes date-time per position.

## 2. Vote (chamber members)
- **Ballot view**: active members see every position currently open for
  voting, with each nominated candidate's name, business, and statement.
- **Cast a vote**: select up to the number of available seats for a
  position and submit; one ballot per member per position, enforced by
  the system (no re-voting, no editing after submission).
- **Status visibility**: members can see when voting opens/closes and
  whether they've already voted, but never live vote counts.

## 3. Close Voting & Publish Results (board/admin)
- **Manual close**: a board member/admin can manually mark voting as
  closed at any time (in addition to the scheduled end date), stopping
  new votes immediately.
- **Manual publish**: results stay hidden — even after voting closes —
  until a board member/admin explicitly clicks "Publish Results." This
  is a separate, deliberate step so votes can be reviewed/counted first.
- **Results view**: once published, members can see the winner(s) per
  position. Admins additionally see the full vote tally.

## 4. Admin Oversight
- An admin/board view of all elections (draft, nominations, voting open,
  closed, published), matching the existing Admin tab pattern.
- Ability to edit or remove a position/candidate before voting opens.
- Ability to re-open voting on a position if closed in error (before
  results are published).

## 5. Optional add-ons (flag as optional scope)
- Email notification when voting opens/closes and when results are
  published (reuses the existing email service).
- Push/in-app notification via the existing `Notification`/`DeviceToken`
  models.

*Self-nomination by members and public candidate statements submitted
directly by nominees were considered and excluded from v1 — only board
members/admins add positions and nominees, matching how the request was
scoped.*
