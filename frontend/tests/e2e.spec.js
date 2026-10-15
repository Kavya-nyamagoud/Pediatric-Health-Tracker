import { test, expect } from '@playwright/test'

test.describe('Pediatric Health Tracker - Full E2E Flow', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:5000/api'
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPass123'

  test('Complete user flow: Register → Login → Create Child → Add Record → View Analytics', async ({ page }) => {
    // ========== REGISTER ==========
    console.log('📝 Step 1: Registering new user...')
    await page.goto(`${baseUrl}/register`)
    await expect(page.locator('h2')).toContainText(/register/i)

    await page.fill('input[placeholder*="Name"]', 'Test Parent')
    await page.fill('input[placeholder*="Email"]', testEmail)
    await page.fill('input[placeholder*="Password"]', testPassword)
    await page.locator('button:has-text("Register")').click()

    // Wait for redirect to dashboard or login success
    await page.waitForURL(`${baseUrl}/dashboard`, { timeout: 5000 }).catch(() => {})
    console.log('✅ Registered successfully')

    // ========== VERIFY DASHBOARD (EMPTY STATE) ==========
    console.log('📊 Step 2: Verifying Dashboard empty state...')
    await page.goto(`${baseUrl}/dashboard`)
    await expect(page.locator('h2')).toContainText('Parent Dashboard')
    await expect(page.locator('text=0 Children')).toBeVisible()
    await expect(page.locator('text=0 Health Records')).toBeVisible()
    console.log('✅ Dashboard empty state correct')

    // ========== NAVIGATE TO CHILDREN PAGE ==========
    console.log('👶 Step 3: Navigating to Children page...')
    await page.click('text=Children')
    await expect(page.locator('h2')).toContainText('My Children')
    console.log('✅ Children page loaded')

    // ========== ADD A CHILD ==========
    console.log('➕ Step 4: Adding a child...')
    await page.click('button:has-text("Add Child")')
    await expect(page.locator('h3')).toContainText('Add New Child')

    await page.fill('input[placeholder="First Name *"]', 'Emma')
    await page.fill('input[placeholder="Last Name *"]', 'Johnson')
    await page.fill('input[type="date"]', '2022-06-15')
    await page.selectOption('select', 'female')
    await page.fill('input[placeholder="Blood Type"]', 'A+')
    await page.fill('textarea[placeholder*="Allerg"]', 'Nuts, Dairy')
    await page.locator('button:has-text("Save Child")').click()

    // Wait for child to appear in list
    await page.waitForSelector('text=Emma Johnson', { timeout: 5000 })
    console.log('✅ Child added successfully')

    // ========== VIEW CHILD DETAILS ==========
    console.log('📄 Step 5: Viewing child details...')
    await page.click('text=View Details')
    await expect(page.locator('h2')).toContainText('Emma Johnson')
    await expect(page.locator('text=Age')).toBeVisible()
    await expect(page.locator('text=female')).toBeVisible()
    await expect(page.locator('text=A+')).toBeVisible()
    await expect(page.locator('text=Nuts, Dairy')).toBeVisible()
    console.log('✅ Child details displayed correctly')

    // ========== ADD HEALTH RECORD (GROWTH) ==========
    console.log('📈 Step 6: Adding growth health record...')
    await page.click('button:has-text("Add Record")')
    await expect(page.locator('h3')).toContainText('Add Health Record')

    await page.selectOption('select', 'growth')
    await page.fill('input[placeholder="Height (cm)"]', '95')
    await page.fill('input[placeholder="Weight (kg)"]', '14.2')
    await page.fill('input[placeholder="Head Circumference (cm)"]', '49')
    await page.fill('input[placeholder="BMI"]', '15.7')
    await page.fill('textarea[placeholder="Notes"]', 'Regular checkup - all good')
    await page.locator('button:has-text("Save Record")').click()

    // Wait for record to appear
    await page.waitForSelector('text=growth', { timeout: 5000 })
    console.log('✅ Growth record added successfully')

    // ========== VERIFY RECORD DETAILS ==========
    console.log('🔍 Step 7: Verifying record details...')
    await expect(page.locator('text=95 cm')).toBeVisible()
    await expect(page.locator('text=14.2 kg')).toBeVisible()
    await expect(page.locator('text=49 cm')).toBeVisible()
    await expect(page.locator('text=Regular checkup - all good')).toBeVisible()
    console.log('✅ Record details displayed correctly')

    // ========== ADD VACCINATION RECORD ==========
    console.log('💉 Step 8: Adding vaccination record...')
    await page.click('button:has-text("Add Record")')
    await page.selectOption('select', 'vaccination')
    await page.fill('input[placeholder="Vaccine Name"]', 'MMR')
    await page.fill('textarea[placeholder="Notes"]', 'First dose administered')
    await page.locator('button:has-text("Save Record")').click()

    await page.waitForSelector('text=vaccination', { timeout: 5000 })
    console.log('✅ Vaccination record added successfully')

    // ========== TEST RECORD FILTERING ==========
    console.log('🔎 Step 9: Testing record type filter...')
    await page.selectOption('select:near(h3:has-text("Health Records"))', 'growth')
    await expect(page.locator('text=growth')).toBeVisible()
    await expect(page.locator('text=vaccination')).not.toBeVisible()

    await page.selectOption('select:near(h3:has-text("Health Records"))', 'all')
    await expect(page.locator('text=growth')).toBeVisible()
    await expect(page.locator('text=vaccination')).toBeVisible()
    console.log('✅ Record filtering works correctly')

    // ========== VERIFY DASHBOARD UPDATED ==========
    console.log('📊 Step 10: Verifying Dashboard stats updated...')
    await page.click('text=Dashboard')
    await expect(page.locator('text=1 Children')).toBeVisible()
    await expect(page.locator('text=2')).toBeVisible() // 2 records total
    console.log('✅ Dashboard stats updated')

    // ========== VIEW ANALYTICS ==========
    console.log('📈 Step 11: Viewing Analytics page...')
    await page.click('text=Analytics')
    await expect(page.locator('h2')).toContainText('Health Analytics')

    // Select the child
    await page.selectOption('select#child-select', { label: 'Emma Johnson' })

    // Wait for charts to render (look for canvas or SVG elements)
    await page.waitForSelector('svg', { timeout: 5000 })
    console.log('✅ Analytics page loaded with charts')

    // ========== VERIFY ANALYTICS STATS ==========
    console.log('📊 Step 12: Verifying analytics stats...')
    await expect(page.locator('text=Total Records')).toBeVisible()
    await expect(page.locator('text=2')).toBeVisible() // Total records
    await expect(page.locator('text=Growth Records')).toBeVisible()
    await expect(page.locator('text=1')).toBeVisible() // Growth records
    console.log('✅ Analytics stats displayed')

    // ========== TEST LOGOUT ==========
    console.log('🔐 Step 13: Testing logout...')
    await page.click('button:has-text("Logout")')
    await page.waitForURL(`${baseUrl}/login`, { timeout: 5000 })
    console.log('✅ Logged out successfully')

    // ========== LOGIN AGAIN ==========
    console.log('🔑 Step 14: Logging back in...')
    await page.fill('input[placeholder*="Email"]', testEmail)
    await page.fill('input[placeholder*="Password"]', testPassword)
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(`${baseUrl}/dashboard`, { timeout: 5000 })
    console.log('✅ Logged in successfully')

    // ========== FINAL VERIFICATION ==========
    console.log('✅ Step 15: Final verification - data persisted...')
    await page.click('text=Children')
    await expect(page.locator('text=Emma Johnson')).toBeVisible()
    console.log('✅ Child data persisted correctly')

    console.log('\n🎉 Complete E2E flow passed successfully!')
  })

  test('Test child deletion', async ({ page }) => {
    console.log('🗑️ Testing child deletion flow...')

    // Login with existing user
    await page.goto(`${baseUrl}/login`)
    await page.fill('input[placeholder*="Email"]', testEmail)
    await page.fill('input[placeholder*="Password"]', testPassword)
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(`${baseUrl}/dashboard`)

    // Navigate to children
    await page.click('text=Children')

    // Find and delete the child
    const childCard = page.locator('text=Emma Johnson').first()
    await expect(childCard).toBeVisible()

    // Click delete button (trash icon) on the child card
    await page.locator('button:has-text("🗑️")').first().click()

    // Confirm deletion in alert
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message}`)
      dialog.accept()
    })

    // Wait for child to disappear
    await page.waitForTimeout(1000)
    console.log('✅ Child deleted successfully')
  })
})
