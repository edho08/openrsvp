import { test, expect } from '@playwright/test';

test.use({ actionTimeout: 15000 });
test.setTimeout(60000);

const event = {
	title: 'Grand Opening Test', description: 'A reusable event',
	eventDate: '2026-10-23T01:00:00Z', timezone: 'Asia/Jakarta',
	location: 'Head Office, Surabaya', contactRequirement: 'email',
	rsvpsClosed: false, atCapacity: false, commentsEnabled: false
};
const invite = {
	templateId: 'kasir-pintar-grand-opening', heading: 'Grand Opening',
	body: 'Undangan peresmian kantor baru.', footer: 'Terima kasih.',
	primaryColor: '#0CA678', secondaryColor: '#087F5B', font: 'Arial',
	customData: JSON.stringify({ recipientName: 'Default Recipient', values: ['One', 'Two', 'Three'],
		heroImage: '/missing-photo.jpg', instagramUrl: 'javascript:alert(1)',
		linkedinUrl: 'https://example.com/social', mapsUrl: 'https://example.com/map' })
};
const attendee = { id: 'guest', name: 'Existing Guest', email: 'guest@example.com',
	rsvpStatus: 'attending', rsvpToken: 'manage', plusOnes: 0, dietaryNotes: '' };

test.beforeEach(async ({ page }) => {
	await page.route('**/api/v1/config', route => route.fulfill({ json: { data: { smsEnabled: false } } }));
	await page.route('**/api/v1/auth/me', route => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }));
	await page.route('**/missing-photo.jpg', route => route.fulfill({ status: 404, body: '' }));
	await page.route('**/api/v1/rsvp/public/test', async route => {
		if (route.request().method() === 'POST') {
			const payload = route.request().postDataJSON();
			expect(payload.name).toBe('New Guest');
			expect(payload.rsvpStatus).toBe('attending');
			await route.fulfill({ json: { data: { rsvpToken: 'manage' } } });
		} else await route.fulfill({ json: { data: { event, invite, questions: [] } } });
	});
	await page.route('**/api/v1/rsvp/public/token/manage', async route => {
		if (route.request().method() === 'PATCH') {
			const payload = route.request().postDataJSON();
			expect(payload.rsvpStatus).toBe('declined');
			await route.fulfill({ json: { data: { ...attendee, ...payload } } });
		} else await route.fulfill({ json: { data: { event, invite, attendee, shareToken: 'test', questions: [], answers: [] } } });
	});
	await page.route('**/api/v1/messages/attendee/**', route => route.fulfill({ json: { data: [] } }));
});

test('personalized responsive invitation, fallback media and RSVP before footer', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/i/test?to=Rina%20Pratama');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Rina Pratama', { timeout: 15000 });
	await expect(page.locator('.go-value-card')).toHaveCount(4);
	await expect(page.locator('.go-building-placeholder')).toBeVisible();
	await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://example.com/social');
	await expect(page.getByRole('link', { name: 'Instagram', exact: true })).toHaveCount(0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	expect(await page.locator('.grand-opening-invite').evaluate(el => {
		const form = el.querySelector('#rsvp-form');
		const footer = el.querySelector('.go-footer');
		return !!form && !!footer && !!(form.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING);
	})).toBe(true);
	await page.locator('#rsvp-name').fill('New Guest');
	await page.locator('#rsvp-email').fill('new@example.com');
	await page.getByRole('button', { name: 'Send RSVP', exact: true }).click();
	await expect(page.getByText('RSVP Received!', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Modify Your RSVP' })).toHaveAttribute('href', '/r/manage');
	expect(errors).toEqual([]);
});

test('manage link personalizes and updates existing response', async ({ page }) => {
	await page.goto('/r/manage');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Existing Guest', { timeout: 15000 });
	await expect(page.locator('.go-response')).toContainText('Your RSVP');
	await page.getByRole('button', { name: 'Edit', exact: true }).click();
	await page.locator('input[value="declined"]').check({ force: true });
	await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
	await expect(page.locator('.go-response')).toContainText('Declined');
});

test('legacy template retains standalone RSVP', async ({ page }) => {
	await page.route('**/api/v1/rsvp/public/test', route => route.fulfill({
		json: { data: { event, invite: { ...invite, templateId: 'balloon-party' }, questions: [] } }
	}));
	await page.goto('/i/test');
	await expect(page.locator('.invite-card')).toBeVisible({ timeout: 15000 });
	await expect(page.locator('.grand-opening-invite')).toHaveCount(0);
	await expect(page.locator('#rsvp-name')).toBeVisible();
});
