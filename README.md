# School Management and Student Registration System

React (Vite) + Node.js/Express + MySQL.
Theme: green, brown and white.

```
school-system/
  backend/    Express API, MySQL schema, seed scripts
  frontend/   React web app
```

## 1. Requirements
- Node.js 18 or newer
- MySQL running on your computer (user and password known)

## 2. Start the backend
```bash
cd backend
cp .env.example .env        # on Windows: copy .env.example .env
```
Open `.env` and set:
- `DB_PASSWORD` to your MySQL password
- `DB_NAME=school_management` (the default local database name)
- `JWT_SECRET` to any long random text

For local XAMPP MySQL, the example uses `localhost:3306` without TLS. Set `DB_PORT` to your local MySQL port if it differs. On the hosted backend, set `DB_HOST` and `DB_PORT` to the hosted database's values in the host's environment settings; remote hosts use verified TLS. Local `.env` values and hosted environment settings are separate, so changing the local port does not change the hosted connection.

Then:
```bash
npm install
npm run db:init     # creates the database/tables and applies migrations
npm run seed        # creates the Super Admin, classes, term, starter requirements
npm run dev         # API on http://localhost:5000
```
If the database already exists, run `npm run db:migrate` from `backend` to add secure student QR tokens to existing records.

## 3. Deploying the backend
In the backend host's environment-variable settings, set `JWT_SECRET` to a long, random private value and `CLIENT_URL` to the frontend's origin (for example `https://school.example.com`, without a trailing slash). Set the database variables there too. Do not put `JWT_SECRET` in frontend settings, commit it to Git, or share it publicly. After saving the variables, restart or redeploy the backend. If `JWT_SECRET` is missing, login and authenticated API requests return a clear configuration error instead of failing while creating or verifying tokens. Changing the value invalidates existing login sessions.

## 4. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev         # open http://localhost:5173
```
Local development uses the Vite proxy to send `/api` requests to `http://localhost:5000`; no frontend `.env` file is needed. If the deployed frontend and backend use different hostnames, set `VITE_API_URL` in the frontend build environment to the backend origin (for example `https://api.example.com`, without `/api`) and rebuild the frontend.

Student profiles include a printable, landscape student identity card with a real QR code containing only a random opaque token. To use it, open **Students → Scan student QR**, or scan the code using the phone's camera. The website requires staff login before resolving the token or showing the student profile; profile and QR image APIs also enforce staff roles. In-app camera scanning requires a recent Chrome or Edge browser and a secure connection (HTTPS, or localhost); if camera scanning is unavailable, paste the card QR link instead.

When printing cards for phone use, set `PUBLIC_APP_URL` in `backend/.env` to the frontend URL reachable by that phone before opening the student profile (for example `https://school.example.com`). For a local network URL, it must be reachable from the phone; HTTPS is needed for the in-app camera scanner.

The database already supports `photo_path`; super administrators and registrars can upload a JPEG, PNG, or WebP photo from the student profile (maximum 5 MB). Images are served only through the authenticated staff API. Official UNILAK and APADEM logo files were not present in the project, so the card shows clearly labeled placeholders. Put approved image files at `frontend/public/logos/unilak.png` and `frontend/public/logos/apadem.png` and replace the labeled placeholders in `StudentIdCard.jsx`. Registration date/status are displayed; issue date is the print date, while expiry is not configured in the database.

To scan permission cards with a phone on the same Wi-Fi, open the app on the computer using its LAN address (for example `http://192.168.1.20:5173`) instead of `localhost`. Find the address with `ipconfig` on Windows. The QR will use that address; keep the frontend running and allow Node.js through Windows Firewall if prompted. Staff must log in on the phone to see the student's information.
For a deployed site, set `PUBLIC_APP_URL` in `backend/.env` to the frontend's reachable URL (for example `https://school.example.com`).

## 5. First login
Username: `admin`   Password: `Admin@12345`  (change it in `.env` before seeding, or reset it from Users)

## 6. Try the full flow
1. Log in as admin. Open **Students**, click **Register student** (tick "Register for current term"). Note the Student ID.
2. Open that student's profile, upload a photo if available, then print the identity card. Use **Students → Scan student QR** or scan with a phone camera; a logged-out staff member will be sent to login before the profile opens.
3. Log out. On the login page click **Create your account**. Enter the Student ID and the student or parent phone you typed. The system gives the student a username.
4. Log in as the student: see requirements, request a permission.
5. Log in as admin: **Permissions**, approve it, download the permission card PDF. Scan its QR code or paste its link in "Verify card".
6. **Excel**: download the template, fill it, import with preview, export, and bulk update.

## Permission to leave school (two steps)
1. A student sends a request, **or** the Dean of Discipline creates a permission directly for a student.
2. The **Dean of Discipline** approves a student's request (permissions created by the Dean skip this step).
3. The **Secretary** confirms. Only then the permission number and the PDF card with the QR code are created.
4. The person who approved in step 2 cannot also confirm in step 3.

Create the Dean and Secretary logins in **Users** (super admin).

## Arrival, dormitory bed and refectory table
1. In **Dormitories** add a dormitory for boys and one for girls with a number of bunks. Each bunk has two beds: **A = lower, B = upper** (1A, 1B, 2A, 2B ...).
2. In **Refectory** add tables (10 students per table by default, you can change each table).
3. At the start of term open **Arrivals** and click **Report arrival** (or select many students and report them together).
4. Boarding students automatically get a bed in the dormitory for their gender and a table. Day students are only marked as arrived.
5. Returning students keep last term's bed and table when still free, otherwise they get the next free ones.
6. If beds or tables run out, the arrival is still saved with a warning. Add more beds or tables, then click **Assign bed/table**.
Students see their dormitory, bed and table in their portal.

## Roles
| Role | What it can do |
|---|---|
| super_admin | Everything, including users and settings |
| registrar | Students, registration, requirements, permissions, Excel, setup |
| dean_of_discipline | Approves student permission requests or creates permissions; verifies cards; reports arrivals |
| secretary | Confirms permissions (issues the card); verifies cards; reports arrivals |
| staff | View students, check requirements, verify cards, report arrivals |
| student | Own data, registration, requirements, permission requests and cards |

Create registrar and staff accounts in **Users** (super admin only).

## Notes
- Student accounts are verified by comparing the entered phone number with the student's or parent's registered number (no SMS). Wrong guesses are limited to 5 per 30 minutes.
- The QR code holds only a random token. Scanning it needs a staff login and opens the student's profile, guardian, registration, requirements and permission information.
- Every important action is saved in the `audit_logs` table.
- Not included yet (from your future-work list): parent accounts, student photo upload, SMS/email notifications, fees.
