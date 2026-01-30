/**
 * EXAMPLE: Complete E2E Test Suite for E-commerce
 * Framework: Playwright
 * Pattern: Page Object Model + Data-Driven
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

// Test data
const users = [
  {
    email: 'standard@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  },
  {
    email: 'premium@example.com',
    password: 'password456',
    firstName: 'Jane',
    lastName: 'Smith',
  },
];

const products = [
  { id: 1, name: 'Wireless Headphones', price: 99.99 },
  { id: 2, name: 'USB-C Cable', price: 19.99 },
  { id: 3, name: 'Laptop Stand', price: 49.99 },
];

test.describe('E-commerce: Purchase Flow', () => {
  let loginPage: LoginPage;
  let productsPage: ProductsPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Login before each test
    await loginPage.navigateToLogin();
    await loginPage.login(users[0].email, users[0].password);
  });

  test('user can browse products', async ({ page }) => {
    await productsPage.navigateToProducts();

    // Verify all products are displayed
    for (const product of products) {
      await expect(productsPage.getProductCard(product.id)).toBeVisible();
      await expect(productsPage.getProductName(product.id)).toContainText(product.name);
      await expect(productsPage.getProductPrice(product.id)).toContainText(`$${product.price}`);
    }
  });

  test('user can add product to cart', async ({ page }) => {
    await productsPage.navigateToProducts();

    // Add first product to cart
    await productsPage.addProductToCart(products[0].id);

    // Verify cart badge updated
    await expect(productsPage.cartBadge).toContainText('1');

    // Navigate to cart
    await productsPage.navigateToCart();

    // Verify product in cart
    await expect(cartPage.getCartItem(products[0].id)).toBeVisible();
    await expect(cartPage.cartTotal).toContainText(`$${products[0].price}`);
  });

  test('user can add multiple products to cart', async ({ page }) => {
    await productsPage.navigateToProducts();

    // Add multiple products
    await productsPage.addProductToCart(products[0].id);
    await productsPage.addProductToCart(products[1].id);
    await productsPage.addProductToCart(products[2].id);

    // Verify cart badge
    await expect(productsPage.cartBadge).toContainText('3');

    // Navigate to cart
    await productsPage.navigateToCart();

    // Verify all products in cart
    for (const product of products) {
      await expect(cartPage.getCartItem(product.id)).toBeVisible();
    }

    // Verify total
    const expectedTotal = products.reduce((sum, p) => sum + p.price, 0);
    await expect(cartPage.cartTotal).toContainText(`$${expectedTotal.toFixed(2)}`);
  });

  test('user can remove product from cart', async ({ page }) => {
    await productsPage.navigateToProducts();

    // Add products
    await productsPage.addProductToCart(products[0].id);
    await productsPage.addProductToCart(products[1].id);

    // Navigate to cart
    await productsPage.navigateToCart();

    // Remove first product
    await cartPage.removeProduct(products[0].id);

    // Verify product removed
    await expect(cartPage.getCartItem(products[0].id)).not.toBeVisible();
    await expect(cartPage.getCartItem(products[1].id)).toBeVisible();

    // Verify total updated
    await expect(cartPage.cartTotal).toContainText(`$${products[1].price}`);
  });

  test('user can checkout', async ({ page }) => {
    // Add products to cart
    await productsPage.navigateToProducts();
    await productsPage.addProductToCart(products[0].id);
    await productsPage.navigateToCart();

    // Proceed to checkout
    await cartPage.proceedToCheckout();

    // Fill shipping information
    await checkoutPage.fillShippingInformation({
      firstName: users[0].firstName,
      lastName: users[0].lastName,
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
    });

    // Select shipping method
    await checkoutPage.selectShippingMethod('standard');

    // Fill payment information (test mode)
    await checkoutPage.fillPaymentInformation({
      cardNumber: '4242 4242 4242 4242',
      cardName: 'John Doe',
      expiryDate: '12/25',
      cvv: '123',
    });

    // Place order
    await checkoutPage.placeOrder();

    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\/.*/);
    await expect(checkoutPage.orderConfirmationMessage).toBeVisible();
    await expect(checkoutPage.orderNumber).toBeVisible();
  });

  test('user cannot checkout with empty cart', async ({ page }) => {
    await productsPage.navigateToCart();

    // Verify checkout button disabled or not visible
    await expect(cartPage.checkoutButton).not.toBeVisible();
  });

  test('order total is calculated correctly', async ({ page }) => {
    await productsPage.navigateToProducts();

    // Add products
    await productsPage.addProductToCart(products[0].id); // $99.99
    await productsPage.addProductToCart(products[1].id); // $19.99
    await productsPage.navigateToCart();

    // Expected: $99.99 + $19.99 = $119.98
    const subtotal = products[0].price + products[1].price;
    const shipping = 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Verify breakdown
    await expect(cartPage.cartSubtotal).toContainText(`$${subtotal.toFixed(2)}`);
    await expect(cartPage.shippingCost).toContainText(`$${shipping.toFixed(2)}`);
    await expect(cartPage.taxAmount).toContainText(`$${tax.toFixed(2)}`);
    await expect(cartPage.cartTotal).toContainText(`$${total.toFixed(2)}`);
  });
});

test.describe('E-commerce: Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  for (const user of users) {
    test(`user can login with valid credentials: ${user.email}`, async ({ page }) => {
      await loginPage.login(user.email, user.password);

      // Verify redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Verify user name displayed
      await expect(page.locator('[data-testid="user-name"]')).toContainText(user.firstName);
    });
  }

  test('user cannot login with invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Verify error message
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');

    // Verify still on login page
    await expect(page).toHaveURL('/login');
  });

  test('user can reset password', async ({ page }) => {
    await loginPage.navigateToPasswordReset();
    await loginPage.fillPasswordResetEmail('user@example.com');
    await loginPage.submitPasswordReset();

    // Verify success message
    await expect(loginPage.successMessage).toBeVisible();
    await expect(loginPage.successMessage).toContainText('Password reset email sent');
  });
});

test.describe('E-commerce: Product Search', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.navigateToProducts();
  });

  test('user can search for products', async ({ page }) => {
    // Search for "wireless"
    await productsPage.searchProducts('wireless');

    // Verify search results
    await expect(productsPage.getProductCard(products[0].id)).toBeVisible();
    await expect(productsPage.getProductName(products[0].id)).toContainText('Wireless');
  });

  test('user can filter products by price', async ({ page }) => {
    // Filter by price range
    await productsPage.filterByPrice({ min: 20, max: 60 });

    // Verify only products in range are shown
    await expect(productsPage.getProductCard(products[1].id)).toBeVisible(); // $19.99 - filtered out
    await expect(productsPage.getProductCard(products[2].id)).toBeVisible(); // $49.99 - shown
  });

  test('user can sort products', async ({ page }) => {
    // Sort by price ascending
    await productsPage.sortProducts('price-asc');

    // Verify order
    const prices = await productsPage.getProductPrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });
});

test.describe('E-commerce: Visual Regression', () => {
  test('homepage matches snapshot', async ({ page }) => {
    await page.goto('/');

    // Full page snapshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });

  test('product page matches snapshot', async ({ page }) => {
    await page.goto('/products/1');

    await expect(page).toHaveScreenshot('product-page.png', {
      fullPage: true,
    });
  });

  test('cart page matches snapshot', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products');
    await page.click('[data-testid="product-1-add-to-cart"]');
    await page.goto('/cart');

    await expect(page).toHaveScreenshot('cart-page.png', {
      fullPage: true,
    });
  });
});

test.describe('E-commerce: Accessibility', () => {
  test('products page is accessible', async ({ page }) => {
    await page.goto('/products');

    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/products/i);

    // Check product cards have accessible names
    const productCards = page.locator('[data-testid^="product-card-"]');
    const count = await productCards.count();

    for (let i = 0; i < count; i++) {
      const card = productCards.nth(i);
      await expect(card).toHaveAttribute('role', 'article');
    }
  });

  test('checkout form is accessible', async ({ page }) => {
    await page.goto('/checkout');

    // Check form labels
    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toHaveAccessibleLabel(/first name/i);

    // Check error messages are associated with inputs
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Required field errors should be visible
    const errors = page.locator('[role="alert"]');
    await expect(errors.first()).toBeVisible();
  });
});
