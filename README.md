

DUVI
Dehradun → Garud Ride Sharing App
Software Requirements Specification
March 2026
https://duvi.duckdns.org


 
1. Introduction
1.1 Purpose
This Software Requirements Specification (SRS) describes the complete functional and non-functional requirements for Duvi, a Progressive Web App (PWA) designed to connect drivers and passengers traveling the Dehradun to Garud route in Uttarakhand, India.

1.2 Product Overview
Duvi is a convenience tool — not a replacement for how drivers and passengers currently operate. Drivers still take phone calls and manually lock seats. Duvi makes coordination faster and more reliable by providing a digital booking system, seat grid, and WhatsApp-based notifications.

1.3 Scope
Duvi serves a fixed route: Dehradun to Garud, with pickup points along the way. The app targets a small community of known drivers and their regular passengers. It is not designed to scale to arbitrary routes or large user bases in v1.

1.4 Intended Audience
This document is intended for the developer (Harsh Negi), future contributors, and any drivers or stakeholders who want to understand how the system works.

1.5 Definitions
Term	Definition
PWA	Progressive Web App — works in browser, installable on phones without app store
OTP	One-Time Password — 6-digit code sent via WhatsApp for authentication
JWT	JSON Web Token — used to maintain user sessions after login
Seat Hold	Temporary 5-minute reservation when a passenger selects a seat
PM2	Node.js process manager that keeps the server running continuously
Nginx	Web server that serves the frontend and proxies API requests

2. Overall Description
2.1 Product Perspective
Duvi is a standalone PWA accessible via web browser on any device. It requires no app store installation. The system consists of a React.js frontend, Node.js/Express backend, MongoDB database, and WhatsApp-based notification system.

2.2 User Classes
Role	Description	Access Level
Passenger	Searches and books seats on available rides	Search, book, cancel, view bookings
Driver	Schedules rides, manages bookings, locks seats	Create rides, accept/reject, manage seats
Admin	You (Harsh) — oversees entire system	Full access to all users, rides, logs

2.3 Operating Environment
•	Frontend: Any modern mobile or desktop browser (Chrome, Safari, Firefox)
•	Backend: Node.js v20 on AWS Lightsail Ubuntu 24.04 (2GB RAM)
•	Database: MongoDB 7.0 running locally on the server
•	Domain: https://duvi.duckdns.org (Duck DNS + Let's Encrypt SSL)
•	WhatsApp: whatsapp-web.js running on a spare phone number

2.4 Design Constraints
•	No Google Play Store or Apple App Store publishing (PWA only)
•	No online payment processing (cash only in v1)
•	Fixed route only — Dehradun to Garud with defined stops
•	WhatsApp bot uses unofficial API — may be flagged if overused
•	Monthly cost limited to ~₹900/month (Lightsail + domain)

2.5 The Route
Stop	Estimated Time from Dehradun	Radius for Pickup (km)
Dehradun	0 min (departure)	15
Rishikesh	45 min	10
Shivpuri	75 min	8
Byasi	95 min	8
Devprayag	125 min	8
Srinagar (Garhwal)	155 min	10
Rudraprayag	185 min	8
Augustmuni	215 min	8
Karnprayag	235 min	8
Garud	245 min (final stop)	—

3. Functional Requirements
3.1 Authentication
ID	Requirement	Notes
FR-001	User enters 10-digit Indian phone number to login	Validated: digits only, exactly 10
FR-002	System sends 6-digit OTP to user's WhatsApp	Valid for 5 minutes, one-time use
FR-003	User enters OTP to verify identity	Max 3 OTP requests per phone per hour
FR-004	New users must provide name and age on first login	Age stored as integer
FR-005	System returns JWT token on successful verification	Token valid for 30 days
FR-006	All protected routes require valid JWT in Authorization header	Returns 401 if missing or expired

3.2 Ride Management (Driver)
ID	Requirement	Notes
FR-007	Verified driver can schedule a ride	Must be admin-verified to schedule
FR-008	Driver selects start stop and end stop from dropdown	End must come after start on route
FR-009	System auto-generates all intermediate stops	Based on ROUTE array
FR-010	System auto-calculates estimated pickup time at each stop	Based on departure time + offset
FR-011	Driver sets fare per seat in INR	Shown to passengers before booking
FR-012	Driver previews stops and times before confirming	Preview button in schedule screen
FR-013	Each ride has 10 seats created automatically	Status: available/held/booked/locked
FR-014	Driver can lock/unlock individual seats	Locked seats cannot be booked
FR-015	Driver can cancel entire ride	Requires confirmation, notifies all passengers
FR-016	Driver sees all upcoming and past rides on dashboard	Sorted by date
FR-017	Driver sees seat fill bar on each ride card	Booked count / 10

3.3 Ride Search (Passenger)
ID	Requirement	Notes
FR-018	Passenger searches rides by date, pickup stop, dropoff stop	All three fields required
FR-019	System validates pickup comes before dropoff on route	Returns error if invalid direction
FR-020	Search results show only rides with available seats	Held/booked/locked seats excluded from count
FR-021	If no rides on exact date, show rides within 3 days	Past dates excluded from nearby results
FR-022	Nearby dates only shown when exact date has zero rides	Not shown alongside exact date results
FR-023	Each ride card shows driver name, age, fare, departure time, available seats	Driver phone not shown until booking accepted

3.4 Seat Booking
ID	Requirement	Notes
FR-024	Passenger selects seat from visual seat grid	5 rows of 2 seats each
FR-025	Selecting a seat holds it atomically for 5 minutes	MongoDB atomic update prevents double booking
FR-026	Held seats auto-release after 5 minutes if not confirmed	Cleanup job runs every 60 seconds
FR-027	Passenger selects pickup stop (must be on this ride)	Dropdown limited to ride's stops
FR-028	Passenger enters pickup landmark as free text	e.g. 'Near Clock Tower, HDFC Bank'
FR-029	Passenger selects dropoff stop (must come after pickup)	Dropdown updates based on pickup selection
FR-030	Booking created with status 'pending' after confirmation	Driver notified via WhatsApp
FR-031	Passenger can book multiple seats in same ride	Each seat creates a separate booking record
FR-032	Passenger can book rides on same day with different drivers	No restriction on same-day bookings

3.5 Booking Management
ID	Requirement	Notes
FR-033	Driver sees pending booking requests with passenger details	Name, age, pickup landmark, dropoff
FR-034	Driver can accept a pending booking	Passenger notified via WhatsApp with driver phone
FR-035	Driver can reject a pending booking	Seat released, passenger notified via WhatsApp
FR-036	Pending bookings auto-expire after 24 hours	Driver's phone sent to passenger for direct contact
FR-037	Passenger can cancel a booking (pending or accepted)	Seat released, driver notified via WhatsApp
FR-038	Rejected passenger cannot rebook the same ride	Prevented at booking creation
FR-039	Cancelled seat is immediately available for other passengers	No driver action needed
FR-040	Driver sees confirmed passengers with 'Open in Maps' button	Opens Google Maps to pickup coordinates
FR-041	Passenger sees all their bookings with status	Pending/Accepted/Rejected/Cancelled

3.6 Notifications
Event	Recipient	Message Content
OTP login	User	OTP code, valid 5 mins
New booking request	Driver	Passenger name, age, seat, pickup, dropoff, date
Booking accepted	Passenger	Seat confirmed, pickup details, driver name and phone, fare
Booking rejected	Passenger	Sorry message, suggestion to search again
No response in 24hrs	Passenger	Driver's phone number for direct contact
Passenger cancels	Driver	Passenger name, seat number, date, seat now available
Driver cancels ride	All passengers	Ride cancelled, driver phone for contact
12-hour reminder	Passenger	Ride time, pickup landmark, driver phone
12-hour reminder	Driver	Full passenger list with seats and pickup locations

3.7 Admin Functions
ID	Requirement	Notes
FR-042	Admin sees overview stats on dashboard	Total users, drivers, rides, bookings, pending
FR-043	Admin sees all users with role and status	Driver verification status shown
FR-044	Admin can promote a passenger to verified driver	Sets role=driver, isVerified=true
FR-045	Admin can suspend any user (not admin)	Suspended users cannot login
FR-046	Admin can unsuspend a user	Restores access immediately
FR-047	Admin can view all rides across all drivers	With status and driver details
FR-048	Admin can cancel any ride	Cancels all bookings, notifies passengers
FR-049	All user actions are logged automatically	userId, role, action, details, timestamp
FR-050	Admin can view last 100 action logs	Sorted by most recent

4. Non-Functional Requirements
4.1 Performance
•	API response time under normal load: < 500ms
•	Seat hold atomic operation must complete in < 100ms to prevent race conditions
•	Frontend initial load time: < 3 seconds on 4G connection
•	WhatsApp message delivery: < 5 seconds after trigger event

4.2 Security
•	All API routes except /auth/send-otp and /auth/verify-otp require valid JWT
•	Passwords are not stored — OTP-only authentication
•	JWT secret stored in .env file, never committed to Git
•	MongoDB not exposed to public internet — only accessible from localhost
•	Nginx serves as public-facing entry point — Express never directly exposed
•	HTTPS enforced via Let's Encrypt SSL certificate (auto-renews every 90 days)

4.3 Reliability
•	PM2 automatically restarts the Node.js process if it crashes
•	PM2 startup configured to auto-start on server reboot
•	MongoDB enabled as systemd service — auto-starts on reboot
•	WhatsApp client auto-reconnects on disconnection with 5-second delay
•	Detached frame errors trigger automatic WhatsApp reinitialization

4.4 Usability
•	App installable on Android and iPhone as PWA (no app store required)
•	All core flows completable in under 3 taps
•	Driver can schedule a ride in under 1 minute
•	Seat grid visually communicates status through color coding
•	Error messages in plain language — no technical jargon shown to users

4.5 Availability
•	Target uptime: 95%+ (AWS Lightsail SLA)
•	Scheduled maintenance communicated to drivers via WhatsApp
•	WhatsApp fallback: if app is down, drivers still take phone calls as before

5. System Architecture
5.1 Tech Stack
Layer	Technology	Purpose
Frontend	React.js + Tailwind CSS + Vite	User interface
Backend	Node.js + Express.js	REST API
Database	MongoDB + Mongoose	Data persistence
Authentication	WhatsApp OTP + JWT	User identity
Notifications	whatsapp-web.js	OTP and booking updates
Web Server	Nginx	Reverse proxy + static files
Process Manager	PM2	Keep Node.js running
Hosting	AWS Lightsail 2GB RAM	Production server
Domain	duvi.duckdns.org (Duck DNS)	Free subdomain
SSL	Let's Encrypt (Certbot)	Free HTTPS

5.2 Database Collections
Users
Field	Type	Description
name	String (required)	User's full name
phone	String (unique)	10-digit Indian phone number
role	Enum	passenger / driver / admin
age	Number (required)	User's age
isVerified	Boolean	Admin has verified this driver
isSuspended	Boolean	Account suspended by admin
createdAt	Date	Auto-generated timestamp

Rides
Field	Type	Description
driverId	ObjectId (ref: User)	Driver who created this ride
date	String	Format: YYYY-MM-DD
departureTime	String	Format: HH:MM (24hr)
startStop	String	Starting town on the route
endStop	String	Ending town on the route
stops	Array of objects	Location + estimatedTime per stop
fare	Number	Price per seat in INR
seats	Array (10 items)	Each has number, status, heldBy, heldUntil
status	Enum	scheduled / completed / cancelled

Bookings
Field	Type	Description
rideId	ObjectId (ref: Ride)	The ride being booked
passengerId	ObjectId (ref: User)	Passenger who made booking
seatNumber	Number	1-10
pickupStop	String	Town where passenger boards
pickupLandmark	String	Specific address/landmark
pickupCoordinates	Object {lat, lng}	GPS coordinates of pickup
dropoffStop	String	Town where passenger exits
status	Enum	pending / accepted / rejected / cancelled
cancelledBy	String	passenger / driver / null

Logs
Field	Type	Description
userId	ObjectId (ref: User)	User who performed the action
role	String	Role at time of action
action	String	e.g. verified_driver, cancelled_ride
details	Object	Relevant IDs and context
createdAt	Date	Auto-generated timestamp

6. API Endpoints
Method	Endpoint	Auth Required	Description
POST	/api/auth/send-otp	No	Send OTP to phone via WhatsApp
POST	/api/auth/verify-otp	No	Verify OTP, return JWT token
GET	/api/auth/me	Yes	Get current user details
POST	/api/rides	Driver	Create a new ride
GET	/api/rides	Yes	Search rides by date/pickup/dropoff
GET	/api/rides/driver	Driver	Get this driver's rides
GET	/api/rides/:id	Yes	Get single ride with seats
PATCH	/api/rides/:id/seats	Driver	Lock or unlock a seat
PATCH	/api/rides/:id/cancel	Driver	Cancel entire ride
POST	/api/bookings	Passenger	Book a seat
GET	/api/bookings/my	Passenger	Get my bookings
GET	/api/bookings/ride/:id	Driver	Get bookings for a ride
PATCH	/api/bookings/:id/accept	Driver	Accept a booking
PATCH	/api/bookings/:id/reject	Driver	Reject a booking
PATCH	/api/bookings/:id/cancel	Passenger	Cancel a booking
GET	/api/admin/users	Admin	Get all users
PATCH	/api/admin/users/:id/verify	Admin	Verify a driver
PATCH	/api/admin/users/:id/make-driver	Admin	Promote to driver
PATCH	/api/admin/users/:id/suspend	Admin	Suspend a user
PATCH	/api/admin/users/:id/unsuspend	Admin	Unsuspend a user
GET	/api/admin/rides	Admin	Get all rides
GET	/api/admin/rides/:id	Admin	Get ride with bookings
PATCH	/api/admin/rides/:id/cancel	Admin	Cancel a ride
GET	/api/admin/stats	Admin	Get dashboard stats
GET	/api/admin/logs	Admin	Get last 100 action logs

7. Frontend Screens
Route	Screen	Access
/login	Phone number entry	Public
/verify	OTP entry + new user signup	Public
/home	Ride search (date, pickup, dropoff)	Passenger
/rides	Search results list	Passenger
/rides/:id	Ride detail + seat grid + booking form	Passenger
/my-bookings	All bookings with status	Passenger
/driver	Driver dashboard with ride cards	Driver
/driver/schedule	Schedule new ride form	Driver
/driver/rides/:id	Manage ride — seats, accept/reject, passenger list	Driver
/admin	Admin dashboard — overview, users, rides, logs	Admin

8. Background Jobs
Job	Interval	Function
Seat cleanup	Every 60 seconds	Releases held seats where heldUntil < now
12-hour reminder	Every 60 minutes	Sends WhatsApp reminders for rides departing in 12 hours
Duck DNS updater	Every 5 minutes (cron)	Updates DNS if server IP changes
SSL renewal	Every 90 days (auto)	Certbot automatically renews Let's Encrypt certificate

9. Deployment
9.1 Infrastructure
Component	Service	Monthly Cost
Server	AWS Lightsail 2GB RAM	~₹830
Domain	Duck DNS (free subdomain)	Free
SSL	Let's Encrypt	Free
Database	MongoDB (self-hosted)	Free
WhatsApp	whatsapp-web.js (spare number)	Free
Total		~₹830/month

9.2 Deployment Process
To deploy updates from laptop to production server:
1.	Make changes on laptop and test locally
2.	Build frontend: cd client && npm run build
3.	Push to GitHub: git add . && git commit -m 'message' && git push
4.	SSH into Lightsail: ssh -i lightsail-key.pem ubuntu@SERVER_IP
5.	Pull and rebuild on server: git pull && cd client && npm run build
6.	Restart backend: pm2 restart duvi-api

10. Planned v2 Features
The following features were intentionally excluded from v1 and will be added based on real user feedback:

Feature	Rationale for Deferral
Ratings and reviews	Not enough users in v1 to make ratings meaningful
Strike and suspension system	Manual admin oversight sufficient at small scale
UPI payment integration	Cash works fine for this community; adds complexity
Driver earnings summary	Useful once multiple drivers are active
Dual role accounts	Needs user feedback on whether it's actually needed
Cancellation cutoff rules	Real usage patterns needed before setting rules
Passenger flagging system	Overkill until user base grows
Rishikesh as a start point	Can be added once core flow is stable
Push notifications (PWA)	WhatsApp more reliable for Indian users
Driver luggage policy	Can be added to ride scheduling form

11. Known Limitations
•	WhatsApp bot uses unofficial API (whatsapp-web.js) — WhatsApp may ban the number if too many messages are sent rapidly
•	OTPs are stored in server memory (Map) — restart clears all pending OTPs
•	No automated database backups configured in v1
•	Single server deployment — no redundancy or failover
•	WhatsApp session may detach after extended idle periods (auto-reconnect implemented)
•	Duck DNS free tier — domain is a subdomain, not a custom .in domain
•	Google Maps autocomplete for pickup validation not implemented in v1 — landmark is free text

12. Appendix
12.1 Seat Status State Machine
From Status	To Status	Trigger
available	held	Passenger clicks seat (atomic DB update)
held	available	5-minute timer expires (cleanup job)
held	booked	Passenger confirms booking
booked	available	Passenger cancels OR driver rejects
available	locked	Driver manually locks seat
locked	available	Driver manually unlocks seat

12.2 WhatsApp Error Handling
Error	Handling
No LID for user	Number not on WhatsApp — logged, message skipped gracefully
Detached Frame	WhatsApp reinitialized automatically after 3 seconds
Auth failure	WhatsApp reinitialized automatically after 5 seconds
Client disconnected	WhatsApp reinitialized automatically after 5 seconds
WhatsApp not ready	Message logged but not sent — OTP still printed in server logs

12.3 Repository
GitHub: https://github.com/hvsnegi/duvi
Live URL: https://duvi.duckdns.org

— End of Document —

