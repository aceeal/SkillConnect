# SkillConnect

A peer-to-peer skill sharing platform that connects learners and mentors in real-time video sessions.

## 🌟 Features

- **Real-time Video Sessions**: HD video calling with screen sharing capabilities
- **Skill Matching**: Intelligent matching based on skills and interests
- **Live Chat**: In-session messaging with message history
- **User Profiles**: Comprehensive profiles with skills, interests, and social media links
- **Admin Dashboard**: Complete admin panel with user management, session monitoring, and analytics
- **Queue System**: Smart matching queue that pairs users based on compatibility
- **Session Management**: Track session duration, manage ongoing sessions
- **Report System**: User reporting functionality with admin review
- **Responsive Design**: Mobile-friendly interface with modern UI

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: MySQL
- **Authentication**: NextAuth.js with multiple providers
- **Real-time Communication**: Socket.io, WebRTC
- **Deployment**: Railway
- **UI Components**: Custom components with Framer Motion animations

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- npm or yarn
- MySQL database

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skillconnect.git
   cd skillconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` for development:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables (see [Environment Variables](#environment-variables) section)

4. **Set up the database**
   ```bash
   # Import the database schema
   mysql -u your_username -p your_database_name < skillconnect.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Environment Variables

### Development (.env.local)
```env
# Development Environment
NODE_ENV=development
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=skillconnect
MYSQL_USER=root
MYSQL_PASSWORD=your_password

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

### Production (.env)
```env
# Production Environment
NODE_ENV=production
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com

# Database Configuration (Railway MySQL)
MYSQL_HOST=your_railway_host
MYSQL_PORT=3306
MYSQL_DATABASE=skillconnect
MYSQL_USER=root
MYSQL_PASSWORD=your_railway_password

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_production_secret
```

## 🗄️ Database Setup

1. **Create MySQL Database**
   ```sql
   CREATE DATABASE skillconnect;
   ```

2. **Import Schema**
   Use the provided `skillconnect.sql` file to set up the database structure:
   ```bash
   mysql -u root -p skillconnect < skillconnect.sql
   ```

3. **Database Tables**
   The schema includes:
   - `users` - User accounts and profiles
   - `skills` - User skills
   - `user_interests` - User interests
   - `messages` - Chat messages
   - `live_sessions` - Video session records
   - `reports` - User reports
   - `user_settings` - User preferences
   - And more...

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Add Environment Variables**
   Set up your production environment variables in Railway dashboard

3. **Deploy**
   ```bash
   railway up
   ```

### Custom Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📱 Usage

### For Users

1. **Sign Up/Login**
   - Create an account or login with existing credentials
   - Support for Google and Facebook authentication

2. **Complete Profile**
   - Add your skills and interests
   - Upload a profile picture
   - Set your preferences

3. **Find Learning Partners**
   - Join the matching queue
   - Get matched with compatible users
   - Accept or decline matches

4. **Start Learning Sessions**
   - Join video calls with matched users
   - Use screen sharing for demonstrations
   - Chat during sessions
   - End sessions when complete

### For Admins

1. **Access Admin Dashboard**
   - Login with admin credentials
   - Navigate to `/admin-dashboard`

2. **Manage Users**
   - View all registered users
   - Ban/unban users
   - Export user data

3. **Monitor Sessions**
   - View active sessions
   - Terminate sessions if needed
   - Access session analytics

4. **Handle Reports**
   - Review user reports
   - Take appropriate actions
   - Update report statuses

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:coverage
```

## 📂 Project Structure

```
skillconnect/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── components/    # React components
│   │   ├── admin-dashboard/ # Admin panel
│   │   ├── live-session/  # Video session pages
│   │   └── ...           # Other pages
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript definitions
├── public/               # Static assets
├── server.js            # Custom server with Socket.io
├── next.config.ts       # Next.js configuration
└── package.json         # Dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Screen sharing may not work on some mobile browsers
- WebRTC connections may fail in restrictive network environments
- Camera/microphone permissions need to be granted for video sessions

## 📞 Support

For support, email support@skillconnect.com or create an issue in this repository.

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this platform
- Special thanks to the open-source community for the amazing tools and libraries
- Inspired by the power of peer-to-peer learning

---

**Built with ❤️ by the SkillConnect Team**