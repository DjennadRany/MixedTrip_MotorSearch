# MixedTrip - Universal Retail

A modern travel search and booking platform, part of the Universal Retail brand.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/DjennadRany/MixedTrip_MotorSearch.git
cd MixedTrip_MotorSearch

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

```
mixedtrip/
├── src/                  # Source files
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── styles/         # CSS/SCSS files
├── public/             # Static files
├── api/                # Backend API
│   ├── src/           # API source files
│   ├── tests/         # API tests
│   └── docs/          # API documentation
├── .github/           # GitHub configuration
│   ├── workflows/     # GitHub Actions
│   └── ISSUE_TEMPLATE/# Issue templates
└── docs/              # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- MongoDB for database
- JWT for authentication

### DevOps
- GitHub Actions for CI/CD
- GitHub Pages for deployment
- Docker for containerization

## 📋 Development Process

1. **Branch Strategy**
   - `main`: Production branch
   - `develop`: Development branch
   - Feature branches: `feature/*`
   - Bug fixes: `fix/*`

2. **Commit Convention**
   ```
   feat: add new feature
   fix: bug fix
   docs: documentation changes
   style: formatting, missing semicolons, etc
   refactor: code refactoring
   test: adding tests
   chore: maintain
   ```

3. **Pull Request Process**
   - Create branch from `develop`
   - Update documentation
   - Create PR with template
   - Get code review
   - Merge to `develop`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- [test-name]

# Run with coverage
npm run test:coverage
```

## 📚 Documentation

- [API Documentation](./api/docs/README.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Development Setup](./docs/development.md)

## 🤝 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Project Board](https://github.com/DjennadRany/MixedTrip_MotorSearch/projects)
- [Live Demo](https://djennadrany.github.io/MixedTrip_MotorSearch)
- [API Documentation](https://djennadrany.github.io/MixedTrip_MotorSearch/api) 