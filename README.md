# FixTrack - Maintenance Reporting System

FixTrack is a maintenance reporting system that allows students to submit maintenance requests and technicians to manage and resolve them.

## Project Structure

```
fixtrack/
├── assets/                 # Frontend assets (CSS, JS)
├── backend/                # Backend code
│   ├── models/            # Database schemas
│   ├── routes/            # API endpoints
│   └── server.js          # Main server file
├── *.html                  # HTML files
├── package.json            # Project dependencies
└── render.yaml             # Render deployment configuration
```

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start MongoDB (make sure it's running on your system)

3. Start the application:
   ```
   npm start
   ```

4. Visit `http://localhost:3000` in your browser

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `PORT` - 10000 (or any port you prefer)
4. Use the following build and start commands:
   - Build: `npm install`
   - Start: `npm start`

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required for production)
- `PORT` - Port to run the server on (defaults to 3000)

## Technology Stack

- **Backend**: Node.js with Express framework
- **Database**: MongoDB via Mongoose ODM
- **Frontend**: Plain HTML, CSS, and client-side JavaScript
- **Authentication**: bcryptjs for password hashing