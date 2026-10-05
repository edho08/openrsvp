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
const questions = [{ id: 'organization', type: 'text', label: 'Instansi / Perusahaan', required: false, options: [], sortOrder: 0 }];

test.beforeEach(async ({ page }) => {
	await page.route('**/api/v1/config', route => route.fulfill({ json: { data: { smsEnabled: false } } }));
	await page.route('**/api/v1/auth/me', route => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }));
	await page.route('**/missing-photo.jpg', route => route.fulfill({ status: 404, body: '' }));
	await page.route('**/api/v1/rsvp/public/test', async route => {
		if (route.request().method() === 'POST') {
			const payload = route.request().postDataJSON();
			expect(payload.name).toBe('New Guest');
			expect(payload.rsvpStatus).toBe('attending');
			expect(payload.answers.organization).toBe('Kasir Pintar');
			await route.fulfill({ json: { data: { rsvpToken: 'manage' } } });
		} else await route.fulfill({ json: { data: { event, invite, questions } } });
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
	await page.getByLabel('Instansi / Perusahaan').fill('Kasir Pintar');
	await page.locator('#rsvp-email').fill('new@example.com');
	await page.getByRole('button', { name: 'KIRIM RSVP', exact: true }).click();
	await expect(page.getByText('RSVP Received!', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Modify Your RSVP' })).toHaveAttribute('href', '/r/manage');
	expect(errors).toEqual([]);
});

test('original assets and seven-section reference geometry', async ({ page }, testInfo) => {
	await page.route('**/api/v1/rsvp/public/test', route => route.fulfill({ json: { data: {
		event, questions, invite: { ...invite, font: 'Inter', primaryColor: '#10A37B', secondaryColor: '#10A37B',
			body: 'kami mengundang Bapak/Ibu untuk hadir dalam momen spesial peresmian kantor baru Kasir Pintar.',
			footer: 'Terimakasih telah menjadi bagian dari perjalanan kami', customData: '{}' }
	} } }));
	await page.goto('/i/test?to=Edward%20Sumanto');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Edward Sumanto', { timeout: 15000 });
	await page.evaluate(() => document.fonts.ready);
	const sections = ['go-cover', 'go-invitation', 'go-journey', 'go-chapter', 'go-details', 'go-rsvp-section', 'go-footer'];
	const heights = [1920, 1614, 1334, 1892, 1892, 1400, 1718];
	for (let i = 0; i < sections.length; i++) {
		const section = page.locator(`.${sections[i]}`);
		await section.scrollIntoViewIfNeeded();
		await expect.poll(() => section.evaluate(el => [...el.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
		const geometry = i === 0 ? section.locator('.go-cover-artwork') : section;
		const box = await geometry.boundingBox();
		expect(box).not.toBeNull();
		// Live RSVP retains required contact and status fields, so it must grow.
		if (i !== 5) expect(Math.abs(box!.height / box!.width - heights[i] / 1080)).toBeLessThan(0.09);
		await geometry.screenshot({ path: testInfo.outputPath(`${sections[i]}.png`), animations: 'disabled' });
	}
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await expect(page.locator('.go-cover-seal')).toHaveAttribute('src', '/invite/grand-opening/seal.webp');
	await expect(page.locator('.go-detail-row img').first()).toHaveAttribute('src', '/invite/grand-opening/detail-calendar.webp');
});

test('mobile cover opens with scroll and uses the supplied Maps location by default', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.route('**/api/v1/rsvp/public/test', route => route.fulfill({ json: { data: {
		event, questions, invite: { ...invite, customData: JSON.stringify({ mapsUrl: 'https://maps.google.com/?q=Kasir+Pintar+Surabaya' }) }
	} } }));
	await page.goto('/i/test?to=Rina%20Pratama');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Rina Pratama', { timeout: 15000 });
	await expect(page.locator('.go-map-card')).toHaveAttribute('href', 'https://maps.app.goo.gl/GtyJiSXfD21XFRZn6');
	await expect(page.locator('.go-map-link')).toHaveText('Lihat Lokasi di Google Maps');

	const scene = page.locator('.go-cover');
	const body = page.locator('.go-envelope-body');
	const flap = page.locator('.go-envelope-flap');
	const letter = page.locator('.go-opening-letter');
	await expect.poll(() => letter.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
	const bodyTopBefore = (await body.boundingBox())?.y;
	const flapTopBefore = (await flap.boundingBox())?.y;
	const letterTopBefore = (await letter.boundingBox())?.y;
	expect(bodyTopBefore).not.toBeUndefined();
	expect(flapTopBefore).not.toBeUndefined();
	expect(letterTopBefore).not.toBeUndefined();
	const sceneTop = await scene.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
	const sceneRange = await scene.evaluate(el => (el as HTMLElement).offsetHeight - window.innerHeight);
	expect(sceneRange).toBeGreaterThan(0);
	await page.evaluate(({ top, range }) => window.scrollTo(0, top + range * 0.6), { top: sceneTop, range: sceneRange });
	await expect.poll(() => scene.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--go-open-progress')))).toBeGreaterThan(0.5);
	expect(await page.locator('.go-cover-title').evaluate(el => Boolean(el.closest('.go-envelope-flap')))).toBe(true);
	const bodyTopDuring = (await body.boundingBox())?.y;
	const flapTopDuring = (await flap.boundingBox())?.y;
	const letterTopDuring = (await letter.boundingBox())?.y;
	expect(bodyTopDuring! - bodyTopBefore!).toBeGreaterThan(100);
	expect(flapTopDuring! - flapTopBefore!).toBeLessThan(-100);
	expect(letterTopBefore! - letterTopDuring!).toBeGreaterThan(100);
	await expect.poll(() => page.locator('.go-cover-stage').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
	await expect.poll(() => letter.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
	expect(await scene.evaluate(el => el.style.getPropertyValue('--go-flap-angle'))).toBe('');
	await expect.poll(() => page.locator('.go-cover-title').evaluate(el => parseFloat(getComputedStyle(el).opacity))).toBeGreaterThan(0.95);
	await expect(page.locator('#rsvp-form')).toHaveCount(1);
	await page.evaluate(({ top, range }) => window.scrollTo(0, top + range), { top: sceneTop, range: sceneRange });
	await expect.poll(() => scene.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--go-open-progress')))).toBe(1);
	await expect.poll(() => letter.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
	const coverBottom = await scene.evaluate(el => el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight);
	await page.evaluate(bottom => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, bottom + 10); }, coverBottom);
	await expect(page.locator('#go-invitation-title')).toBeInViewport();
	await expect(page.locator('.go-cover-stage')).not.toBeInViewport();
});

test('mobile envelope stays static when reduced motion is requested', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/i/test?to=Rina%20Pratama');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Rina Pratama', { timeout: 15000 });
	const scene = page.locator('.go-cover');
	await expect.poll(() => scene.evaluate(el => getComputedStyle(el).position)).toBe('relative');
	await expect.poll(() => scene.evaluate(el => getComputedStyle(el).getPropertyValue('--go-open-progress').trim())).toBe('0');
	await expect(page.locator('#rsvp-form')).toHaveCount(1);
});

test('resizing a loaded desktop page to mobile enables the envelope reveal', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/i/test?to=Rina%20Pratama');
	await expect(page.locator('.go-cover-host strong')).toHaveText('Rina Pratama', { timeout: 15000 });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
	const scene = page.locator('.go-cover');
	const sceneTop = await scene.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
	const sceneRange = await scene.evaluate(el => (el as HTMLElement).offsetHeight - window.innerHeight);
	await page.evaluate(({ top, range }) => window.scrollTo(0, top + range * 0.5), { top: sceneTop, range: sceneRange });
	await expect.poll(() => scene.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--go-open-progress')))).toBeGreaterThan(0.45);
	await expect.poll(() => page.locator('.go-opening-letter').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
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
