#  Srishti - Artist Booking and Portfolio Platform

Srishti is a Django-based web application designed to connect clients with artists for custom artwork requests. The platform allows users to browse artist profiles, view portfolios, send booking requests, upload reference images, manage payments through screenshot verification, and communicate with artists through an integrated messaging system.


##  Features

- User registration and login with JWT-based authentication.
- Role-based access for clients and artists.
- Artist onboarding with profile details such as bio, location, art style, pricing, experience, mediums, phone number, and availability.
- Artist listing with filters for location, art style, and budget range.
- Portfolio image upload and gallery display for artists.
- Booking system for custom artwork requests.
- Support for service types such as standard, express, and premium.
- Delivery options for digital, physical, or both formats.
- Reference image upload during booking.
- Automatic calculation of total price, platform fee, and advance payment.
- Booking status management including pending, accepted, in progress, completed, cancelled, and declined.
- Payment screenshot upload and verification workflow.
- Direct messaging between clients and artists.
- Message attachments for sharing images or files.
- Static frontend pages for home, gallery, booking, chat, contact, terms, privacy policy, login, artist profile, onboarding, and dashboard.
- Admin panel support through Django Admin.

##  Technology Stack

- **Backend:** Python, Django
- **API Framework:** Django REST Framework
- **Authentication:** Simple JWT
- **Frontend:** HTML, CSS, JavaScript
- **Database:** SQLite
- **File Handling:** Django media uploads, Pillow
- **Other Libraries:** django-cors-headers, PyJWT, sqlparse, tzdata

##  Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd srishti
```

Replace `<repository-url>` with the actual GitHub or project repository link.

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

For Windows:

```bash
venv\Scripts\activate
```

For macOS/Linux:

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Move into the Django Project Folder

```bash
cd srishti
```

### 6. Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create a Superuser

```bash
python manage.py createsuperuser
```

### 8. Start the Development Server

```bash
python manage.py runserver
```

Open the application in your browser:

```text
http://127.0.0.1:8000/
```

Django Admin Panel:

```text
http://127.0.0.1:8000/admin/
```

## 📁 Project Structure

```text
srishti/
├── README.md
├── requirements.txt
├── venv/
└── srishti/
    ├── manage.py
    ├── db.sqlite3
    ├── core/
    │   ├── settings.py
    │   ├── urls.py
    │   ├── asgi.py
    │   └── wsgi.py
    ├── users/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── urls.py
    ├── artists/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── urls.py
    ├── bookings/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── urls.py
    ├── messaging/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   └── urls.py
    ├── templates/
    │   ├── index.html
    │   ├── artist.html
    │   ├── booking.html
    │   ├── chat.html
    │   └── other HTML pages
    ├── static/
    │   ├── style.css
    │   ├── dashboard.css
    │   ├── main.js
    │   └── dashboard.js
    └── media/
        ├── avatars/
        ├── portfolio/
        ├── references/
        ├── payment_screenshots/
        └── message_attachments/
```

### Important Files and Folders

- **manage.py:** Django command-line utility used to run the server, migrations, and administrative commands.
- **core/settings.py:** Main configuration file containing installed apps, database settings, static files, media files, authentication settings, and REST framework configuration.
- **core/urls.py:** Main URL routing file for page routes and API routes.
- **users:** Handles custom user accounts with client and artist roles.
- **artists:** Handles artist profiles, portfolio uploads, artist listing, filters, and onboarding.
- **bookings:** Handles artwork booking requests, pricing, status updates, payment screenshot upload, and booking history.
- **messaging:** Handles inbox, conversations, message attachments, and read/unread status.
- **templates:** Contains HTML files for the frontend pages.
- **static:** Contains CSS and JavaScript files used by the frontend.
- **media:** Stores uploaded images and files such as avatars, portfolio images, references, payment screenshots, and message attachments.
- **db.sqlite3:** SQLite database file used for local development.
- **requirements.txt:** Contains all Python dependencies required to run the project.

## 🖼️ Screenshots

Add project screenshots in this section before submission.

### Home Page

```text
Insert screenshot of the home page here.
```

### Artist Listing Page

```text
Insert screenshot of artist browsing and filtering here.
```

### Artist Dashboard

```text
Insert screenshot of the artist dashboard here.
```

### Booking Page

```text
Insert screenshot of the booking form here.
```

### Chat Page

```text
Insert screenshot of the messaging interface here.
```

### Admin Panel

```text
Insert screenshot of the Django admin panel here.
```

## 🗄️ Database Design

The project uses SQLite as the default database for development. The database design is based on Django models and includes relationships between users, artists, bookings, portfolios, and messages.

### Main Models

#### User

The `User` model extends Django's `AbstractUser` and adds:

- `role`: Identifies whether the user is a client or artist.
- `phone`: Stores the user's contact number.

Relationship:

- One user can create multiple bookings as a client.
- One artist user can have one artist profile.
- One user can send and receive many messages.

#### ArtistProfile

The `ArtistProfile` model stores artist-specific details:

- Bio, portfolio URL, location, style, base price, avatar, rating, booking count, availability, phone, experience, and mediums.

Relationship:

- One `ArtistProfile` belongs to one `User`.
- One `ArtistProfile` can have many portfolio images.
- One `ArtistProfile` can receive many bookings.

#### Portfolio

The `Portfolio` model stores artwork images uploaded by artists:

- Image, title, upload date, and artist reference.

Relationship:

- Many portfolio items belong to one artist profile.

#### Booking

The `Booking` model stores custom artwork requests:

- Client, artist, description, service type, artwork size, delivery type, delivery address, preferred date, reference image, status, total price, advance amount, payment status, payment screenshot, and timestamps.

Relationship:

- Many bookings can be created by one client.
- Many bookings can be assigned to one artist profile.

#### Message

The `Message` model stores conversations:

- Sender, receiver, text, attachment, attachment metadata, timestamp, and read status.

Relationship:

- Many messages can be sent and received by users.
- Conversations are built using sender and receiver relationships.

## 🚀 Usage

After starting the development server, users can access the application from `http://127.0.0.1:8000/`.

### Client Workflow

1. Register as a client.
2. Log in to the system.
3. Browse artists by location, style, or budget.
4. View artist details and portfolio images.
5. Create a booking request with artwork details, preferred date, delivery type, and reference image.
6. Wait for the artist to accept the booking.
7. Upload the advance payment screenshot after acceptance.
8. Track booking status from the booking page.
9. Communicate with the artist through the chat page.

### Artist Workflow

1. Register as an artist.
2. Complete artist onboarding with profile, pricing, style, and portfolio details.
3. Manage profile and portfolio images.
4. View incoming booking requests.
5. Accept, decline, start, or complete bookings.
6. Verify submitted payment screenshots.
7. Communicate with clients through the chat page.

### Admin Workflow

1. Log in to the Django admin panel at `http://127.0.0.1:8000/admin/`.
2. Manage users, artist profiles, bookings, messages, and uploaded content.
3. Monitor application data during project demonstration.

## 🔮 Future Enhancements

- Add online payment gateway integration.
- Add email notifications for booking and payment updates.
- Add real-time chat using Django Channels or WebSockets.
- Add rating and review functionality for completed bookings.
- Add advanced search with sorting by price, rating, and availability.
- Add artist verification and approval workflow.
- Add order invoice generation as PDF.
- Add responsive improvements for mobile devices.
- Add deployment support for platforms such as Render, Railway, PythonAnywhere, or AWS.
- Add test cases for APIs and major user workflows.

## 👩‍💻 Author

**Project Name:** Srishti - Artist Booking and Portfolio Platform  
**Developed By:** Your Name  
**Course/Department:** Your Course or Department Name  
**College/University:** Your College or University Name  
**Submitted To:** Faculty/Professor Name  
**Academic Year:** 2025-2026

## 📌 Project Status

This project is developed as an academic Django web application for demonstration and evaluation purposes. It currently supports the major workflows required for an artist-client booking platform, including authentication, artist discovery, booking management, payment proof upload, portfolio management, and messaging.
