/**
 * EXAMPLE: Complete E2E Test Suite for Dashboard
 * Framework: Cypress
 * Pattern: Page Object Model + Custom Commands
 */

describe('Dashboard E2E Tests', () => {
  const user = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  beforeEach(() => {
    // Custom login command
    cy.login(user.email, user.password);
    cy.visit('/dashboard');
  });

  afterEach(() => {
    // Clear cookies and localStorage
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Dashboard Layout', () => {
    it('should display dashboard components', () => {
      // Check header
      cy.get('[data-testid="dashboard-header"]').should('be.visible');
      cy.get('[data-testid="user-avatar"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain', user.name);

      // Check sidebar
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="nav-item"]').should('have.length.greaterThan', 0);

      // Check main content
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should display navigation menu', () => {
      const navItems = ['Dashboard', 'Projects', 'Tasks', 'Calendar', 'Settings'];

      navItems.forEach((item) => {
        cy.contains('[data-testid="nav-item"]', item).should('be.visible');
      });
    });

    it('should display user profile dropdown', () => {
      cy.get('[data-testid="user-avatar"]').click();
      cy.get('[data-testid="user-dropdown"]').should('be.visible');
      cy.get('[data-testid="dropdown-item"]').should('contain', 'Profile');
      cy.get('[data-testid="dropdown-item"]').should('contain', 'Settings');
      cy.get('[data-testid="dropdown-item"]').should('contain', 'Logout');
    });
  });

  describe('Dashboard Widgets', () => {
    it('should display statistics cards', () => {
      const stats = [
        { testid: 'stat-total-projects', label: 'Total Projects' },
        { testid: 'stat-active-tasks', label: 'Active Tasks' },
        { testid: 'stat-completed-tasks', label: 'Completed Tasks' },
        { testid: 'stat-productivity', label: 'Productivity' },
      ];

      stats.forEach((stat) => {
        cy.get(`[data-testid="${stat.testid}"]`).should('be.visible');
        cy.get(`[data-testid="${stat.testid}"]`).within(() => {
          cy.get('[data-testid="stat-label"]').should('contain', stat.label);
          cy.get('[data-testid="stat-value"]').should('be.visible');
        });
      });
    });

    it('should display charts', () => {
      // Activity chart
      cy.get('[data-testid="activity-chart"]').should('be.visible');

      // Productivity chart
      cy.get('[data-testid="productivity-chart"]').should('be.visible');

      // Timeline chart
      cy.get('[data-testid="timeline-chart"]').should('be.visible');
    });

    it('should display recent activity', () => {
      cy.get('[data-testid="recent-activity"]').should('be.visible');

      // Should have at least some activity items
      cy.get('[data-testid="activity-item"]').should('have.length.greaterThan', 0);

      // Each activity item should have timestamp
      cy.get('[data-testid="activity-item"]').first().within(() => {
        cy.get('[data-testid="activity-timestamp"]').should('be.visible');
      });
    });

    it('should display upcoming deadlines', () => {
      cy.get('[data-testid="upcoming-deadlines"]').should('be.visible');

      // Should have deadline items
      cy.get('[data-testid="deadline-item"]').should('have.length.greaterThan', 0);

      // Each deadline should have project name and date
      cy.get('[data-testid="deadline-item"]').first().within(() => {
        cy.get('[data-testid="deadline-project"]').should('be.visible');
        cy.get('[data-testid="deadline-date"]').should('be.visible');
      });
    });
  });

  describe('Dashboard Interactions', () => {
    it('should navigate to projects page', () => {
      cy.get('[data-testid="nav-item"]').contains('Projects').click();
      cy.url().should('include', '/projects');
      cy.get('[data-testid="projects-page"]').should('be.visible');
    });

    it('should navigate to tasks page', () => {
      cy.get('[data-testid="nav-item"]').contains('Tasks').click();
      cy.url().should('include', '/tasks');
      cy.get('[data-testid="tasks-page"]').should('be.visible');
    });

    it('should search for projects', () => {
      cy.get('[data-testid="search-input"]').type('My Project');

      // Should show search results
      cy.get('[data-testid="search-results"]').should('be.visible');

      // Should filter projects
      cy.get('[data-testid="search-result-item"]').should('contain', 'My Project');
    });

    it('should create new project', () => {
      cy.get('[data-testid="create-project-button"]').click();

      // Fill project form
      cy.get('[data-testid="project-name-input"]').type('New Test Project');
      cy.get('[data-testid="project-description-input"]').type('Test description');
      cy.get('[data-testid="project-submit-button"]').click();

      // Should show success message
      cy.get('[data-testid="toast-success"]').should('be.visible');
      cy.get('[data-testid="toast-success"]').should('contain', 'Project created');

      // Should navigate to new project
      cy.url().should('include', '/projects/');
    });

    it('should logout user', () => {
      cy.get('[data-testid="user-avatar"]').click();
      cy.get('[data-testid="dropdown-item"]').contains('Logout').click();

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-page"]').should('be.visible');
    });
  });

  describe('Dashboard Responsiveness', () => {
    const viewports = [
      { device: 'macbook-15', width: 1440, height: 900 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'iphone-x', width: 375, height: 812 },
    ];

    viewports.forEach(({ device, width, height }) => {
      it(`should display correctly on ${device}`, () => {
        cy.viewport(width, height);

        // Header should be visible
        cy.get('[data-testid="dashboard-header"]').should('be.visible');

        // Sidebar visibility depends on viewport
        if (width >= 768) {
          cy.get('[data-testid="sidebar"]').should('be.visible');
        } else {
          // Mobile: hamburger menu should be visible
          cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
        }

        // Dashboard content should be visible
        cy.get('[data-testid="dashboard-content"]').should('be.visible');
      });
    });
  });

  describe('Dashboard Performance', () => {
    it('should load within performance budget', () => {
      cy.window().then((win) => {
        const performanceTiming = win.performance.timing;
        const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;

        // Page should load in less than 3 seconds
        expect(pageLoadTime).to.be.lessThan(3000);
      });
    });

    it('should have no console errors', () => {
      cy.window().then((win) => {
        const errors: string[] = [];

        cy.on('window:load', () => {
          // Listen for console errors
          win.console.error = (message) => {
            errors.push(message);
          };
        });

        // Check for errors after page load
        cy.wrap(errors).should('have.length', 0);
      });
    });
  });

  describe('Dashboard Accessibility', () => {
    it('should have proper heading structure', () => {
      // Single h1
      cy.get('h1').should('have.length', 1);

      // Proper heading hierarchy
      cy.get('h1').then(($h1) => {
        const h1Text = $h1.text();
        cy.log('Page heading:', h1Text);
      });
    });

    it('should have accessible navigation', () => {
      cy.get('[data-testid="nav-item"]').each(($el) => {
        cy.wrap($el).should('have.attr', 'role', 'link');
      });
    });

    it('should focus management on modal open', () => {
      cy.get('[data-testid="create-project-button"]').click();

      // Focus should be trapped in modal
      cy.focused().should('be.within', '[data-testid="create-project-modal"]');

      // Close modal
      cy.get('[data-testid="modal-close-button"]').click();

      // Focus should return to trigger button
      cy.focused().should('have.attr', 'data-testid', 'create-project-button');
    });
  });

  describe('Dashboard Visual Regression', () => {
    it('should match snapshot on desktop', () => {
      cy.viewport(1440, 900);
      cy.get('[data-testid="dashboard-content"]').toMatchImageSnapshot({
        name: 'dashboard-desktop',
      });
    });

    it('should match snapshot on tablet', () => {
      cy.viewport(768, 1024);
      cy.get('[data-testid="dashboard-content"]').toMatchImageSnapshot({
        name: 'dashboard-tablet',
      });
    });

    it('should match snapshot on mobile', () => {
      cy.viewport(375, 812);
      cy.get('[data-testid="dashboard-content"]').toMatchImageSnapshot({
        name: 'dashboard-mobile',
      });
    });
  });

  describe('Dashboard API Integration', () => {
    it('should fetch dashboard data', () => {
      cy.intercept('GET', '/api/dashboard').as('getDashboard');

      cy.wait('@getDashboard').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.response.body).to.have.property('stats');
        expect(interception.response.body).to.have.property('activities');
      });
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/dashboard', { statusCode: 500 }).as('getDashboardError');

      cy.wait('@getDashboardError');

      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load dashboard');
    });
  });
});
