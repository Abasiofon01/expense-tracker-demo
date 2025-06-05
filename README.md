# Transaction Management Dashboard

A full-featured **Transaction Management Dashboard** built with Vue.js, Supabase, and Chart.js. This project includes user and admin dashboards, transaction tracking, charts, filters, and pagination.

## Features

- **Admin & User Dashboards**: Separate views for administrators and regular users.
- **Transaction Table**: Displays income and expenses with:
  - Filtering by date and category
  - Pagination with adjustable rows per page (default: 20)
  - Loading state for better UX
  - Inline actions for editing and deleting transactions
- **Charts & Analytics**:
  - Reflects filtered table data dynamically
  - Shows income vs. expense trends
- **Modals for Adding/Editing Transactions**

## 🛠️ Technology Stack

- **Frontend Framework**: Vue.js 3 with Composition API
- **Supabase** - Backend database & authentication
- **State Management**: Pinia store for transaction management
- **Charts**: Apache ECharts via vue-echarts for data visualization
- **Styling**:CSS with modern design patterns
- **Date Handling**: Luxon for robust date/time operations
- **Build Tool**: Vite

### 🎨 Modern UI/UX

- Clean, responsive design with mobile-first approach
- Interactive hover effects and smooth animations
- Professional color coding for income (green) and expenses (red)
- Intuitive navigation and user-friendly controls

## Setup & Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-repo.git
   cd your-repo
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file and configure Supabase:

   ```sh
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key
   ```

4. Start the development server:

   ```sh
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## Usage

- **Admin Users** can add, edit, and delete transactions.
- **Regular Users** can view their transactions.
- **Filters & Charts** update dynamically.
- **Responsive Design** ensures usability on all screen sizes.

## Roadmap

- [ ] Implement authentication and role-based access
- [ ] Export transactions to CSV
- [ ] Add more chart types for better insights

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) for the reactive framework
- [Apache ECharts](https://echarts.apache.org/) for powerful data visualization
- [Pinia](https://pinia.vuejs.org/) for intuitive state management
- [Luxon](https://moment.github.io/luxon/) for robust date handling

## License

MIT License
