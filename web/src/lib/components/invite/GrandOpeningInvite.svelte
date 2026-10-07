<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { EventQuestion } from '$lib/types';

	interface RsvpPreviewModel {
		collectOrganization: boolean;
		emailRequired: boolean;
		phoneRequired: boolean;
		showEmail: boolean;
		showPhone: boolean;
		contactChoiceRequired: boolean;
		questions: EventQuestion[];
	}

	interface Props {
		rsvpContent?: Snippet;
		heading: string;
		body: string;
		footer: string;
		primaryColor: string;
		secondaryColor: string;
		font: string;
		eventTitle: string;
		eventDescription?: string;
		eventDate: string;
		endDate?: string;
		eventLocation: string;
		timezone?: string;
		customData?: string | Record<string, unknown>;
		recipientName?: string;
		recipientRole?: string;
		rsvpPreview?: RsvpPreviewModel;
	}
	let { rsvpContent, heading, body, footer, primaryColor, secondaryColor,
		font, eventTitle, eventDescription = '', eventDate, endDate, eventLocation,
		timezone, customData = '{}', recipientName = '', recipientRole: linkedRecipientRole = '',
		rsvpPreview = { collectOrganization: false, emailRequired: true, phoneRequired: false, showEmail: true, showPhone: false, contactChoiceRequired: false, questions: [] } }: Props = $props();

	const asset = (name: string) => `/invite/grand-opening/${name}.webp`;
	const defaultVideoURL = 'https://www.youtube.com/watch?v=CjsGjKzpcP4';
	const previousDefaultVideoURLs = ['https://example.com/grand-opening-video'];
	const defaultMapsURL = 'https://maps.app.goo.gl/L4acDDFqgxCmTZ7w8';
	const previousDefaultMapsURLs = [
		'https://maps.app.goo.gl/GtyJiSXfD21XFRZn6',
		'https://maps.google.com/?q=Kasir+Pintar',
		'https://maps.google.com/?q=Kasir+Pintar+Surabaya'
	];
	const defaultMapCoordinates = ['-7.292833', '112.765293'];
	const data = $derived.by((): Record<string, unknown> => {
		try {
			const parsed: unknown = typeof customData === 'string' ? JSON.parse(customData) : customData;
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
		} catch { return {}; }
	});
	function text(value: unknown, fallback: string): string {
		return typeof value === 'string' && value.trim() ? value.trim() : fallback;
	}
	function safeURL(value: unknown): string {
		if (typeof value !== 'string') return '';
		const url = value.trim();
		if (/[()'"<>\\]/.test(url)) return '';
		if (url.startsWith('/')) return url.startsWith('//') ? '' : url;
		try { return ['http:', 'https:'].includes(new URL(url).protocol) ? url : ''; }
		catch { return ''; }
	}
	function socialURL(value: unknown, fallback: string, replacedDefault?: string): string {
		const url = safeURL(value);
		return !url || url === replacedDefault ? fallback : url;
	}
	function youtubeEmbedURL(value: string): string {
		try {
			const url = new URL(value);
			const host = url.hostname.toLowerCase();
			let videoId = '';
			if (host === 'youtu.be') {
				videoId = url.pathname.split('/').filter(Boolean)[0] || '';
			} else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
				if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
				else videoId = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})(?:\/|$)/)?.[1] || '';
			}
			return /^[\w-]{11}$/.test(videoId)
				? `https://www.youtube.com/embed/${videoId}?rel=0`
				: '';
		} catch { return ''; }
	}
	function googleMapsEmbedURL(value: string): string {
		let coordinates: string[] | null = null;
		if (value === defaultMapsURL || previousDefaultMapsURLs.includes(value)) {
			coordinates = defaultMapCoordinates;
		} else {
			try {
				const url = new URL(value);
				if (!['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname.toLowerCase())) return '';
				const placeCoordinates = url.href.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
				const queryCoordinates = (url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('ll') || '')
					.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
				coordinates = placeCoordinates ? [placeCoordinates[1], placeCoordinates[2]]
					: queryCoordinates ? [queryCoordinates[1], queryCoordinates[2]] : null;
			} catch { return ''; }
		}
		if (!coordinates) return '';
		const [latitude, longitude] = coordinates.map(Number);
		if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return '';
		return `https://www.google.com/maps?q=${encodeURIComponent(`${coordinates[0]},${coordinates[1]}`)}&z=17&output=embed`;
	}
	function color(value: string, fallback: string): string {
		return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value.trim()) ? value.trim() : fallback;
	}
	function dateLabel(value: string, options: Intl.DateTimeFormatOptions, fallback: string): string {
		try {
			const date = new Date(value);
			return new Intl.DateTimeFormat('id-ID', { ...options, ...(timezone ? { timeZone: timezone } : {}) }).format(date);
		} catch { return fallback; }
	}
	const brandName = $derived(text(data.brandName, 'Kasir Pintar'));
	const bodyFont = $derived(['Arial', 'Georgia', 'Courier New', 'Comic Sans MS'].includes(font) ? font : 'Grand Opening Sans');
	const title = $derived(text(data.heroTitle, heading === "You're Invited!" ? 'Grand Opening' : heading || 'Grand Opening'));
	const recipient = $derived(text(recipientName, text(data.recipientName, 'Tamu Undangan')));
	const recipientPrefix = $derived(text(data.recipientPrefix, 'To :'));
	const recipientRole = $derived(text(linkedRecipientRole, text(data.recipientRole, text(data.hostRole, ''))));
	const intro = $derived(text(data.intro, body && body !== 'Join us for a wonderful celebration.' && body !== 'Dengan penuh rasa syukur, kami mengundang Anda untuk merayakan babak baru perjalanan Kasir Pintar.' ? body : 'kami mengundang Bapak/Ibu untuk hadir dalam momen spesial peresmian kantor baru Kasir Pintar.'));
	const storyTitle = $derived(text(data.storyTitle === 'Bertumbuh bersama, melayani lebih banyak usaha' ? '' : data.storyTitle, 'Perjalanan Kasir Pintar Bersama UMKM Indonesia'));
	const videoCaption = $derived(text(data.videoCaption, 'Terus berusaha tumbuh bersama UMKM Indonesia'));
	const chapterTitle = $derived(text(data.chapterTitle, 'A New Chapter Begins'));
	const chapterBody = $derived(text(data.chapterBody, 'Kantor baru ini menjadi ruang untuk terus berkolaborasi & menghadirkan energi baru untuk berinovasi dalam melanjutkan perjalanan Kasir Pintar'));
	const closingBody = $derived(text(data.closingBody, footer === 'Kehadiran Anda akan membuat momen ini semakin berarti.' ? 'Terimakasih telah menjadi bagian dari perjalanan kami' : footer || 'Terimakasih telah menjadi bagian dari perjalanan kami'));
	const venueName = $derived(text(data.venueName, 'Head Office Kasir Pintar'));
	const mapsLabel = $derived(text(data.mapsLabel, eventLocation || 'Manyar Kartika III No 12, Menur Pumpungan, Kec. Sukolilo, Kota Surabaya'));
	const buildingImage = $derived(safeURL(data.buildingImage) || safeURL(data.heroImage) || asset('office-front'));
	const interiorImage = $derived(safeURL(data.interiorImage) || asset('office-meeting'));
	const workspaceImage = $derived(safeURL(data.workspaceImage) || asset('office-workspace'));
	const footerImage = $derived(safeURL(data.footerImage) || asset('office-closing'));
	const videoThumbnail = $derived(safeURL(data.videoThumbnail) || safeURL(data.storyImage) || asset('journey-poster'));
	const configuredVideoURL = $derived(safeURL(data.videoUrl));
	const videoURL = $derived(configuredVideoURL && !previousDefaultVideoURLs.includes(configuredVideoURL)
		? configuredVideoURL : defaultVideoURL);
	const videoEmbedURL = $derived(youtubeEmbedURL(videoURL));
	const mapImage = $derived(safeURL(data.mapImage) || asset('maps-preview'));
	const configuredMapURL = $derived(safeURL(data.mapsUrl));
	const mapURL = $derived(configuredMapURL && !previousDefaultMapsURLs.includes(configuredMapURL)
		? configuredMapURL : defaultMapsURL);
	const mapEmbedURL = $derived(googleMapsEmbedURL(mapURL));
	const weekday = $derived(dateLabel(eventDate, { weekday: 'long' }, 'Save the date').replace('Jumat', 'Jum’at'));
	const fullDate = $derived(dateLabel(eventDate, { day: 'numeric', month: 'long', year: 'numeric' }, 'Tanggal akan diumumkan'));
	const time = $derived(dateLabel(eventDate, { hour: '2-digit', minute: '2-digit' }, '--:--').replace('.', ':'));
	const endTime = $derived(endDate ? dateLabel(endDate, { hour: '2-digit', minute: '2-digit' }, '').replace('.', ':') : 'Selesai');
	const zone = $derived(({ 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' } as Record<string, string>)[timezone || ''] || timezone || 'local time');
	const valueDefaults = ['Ruang untuk Berkolaborasi', 'Energi Baru untuk Berinovasi', 'Lingkungan yang Lebih Nyaman', 'Langkah Lebih Jauh untuk UMKM'];
	const valueIcons = ['value-collaboration', 'value-innovation', 'value-comfort', 'value-growth'];
	const valueEmphasis = ['Berkolaborasi', 'Berinovasi', 'Lebih Nyaman', 'UMKM'];
	const values = $derived.by(() => {
		const configured = Array.isArray(data.values) ? data.values : [];
		const oldWireframeValues = configured.length === 3 && configured[0] === 'Berani bertumbuh' && configured[1] === 'Melayani dengan hati' && configured[2] === 'Memberi dampak';
		return valueDefaults.map((fallback, index) => text(oldWireframeValues ? '' : configured[index], fallback));
	});
	const socials = $derived([
		{ name: 'Instagram', icon: 'social-instagram', url: socialURL(data.instagramUrl, 'https://www.instagram.com/kasirpintar/') },
		{ name: 'YouTube', icon: 'social-youtube', url: socialURL(data.youtubeUrl, 'https://www.youtube.com/@KasirPintar', 'https://www.youtube.com/channel/UCnclxxBiwvGFq7Sy5lzMFbA') },
		{ name: 'TikTok', icon: 'social-tiktok', url: socialURL(data.tiktokUrl, 'https://www.tiktok.com/@kasirpintar', 'https://www.tiktok.com/@kasirpintar?lang=en') }
	]);
	let failedImages = $state<string[]>([]);
	function fail(url: string) { if (!failedImages.includes(url)) failedImages = [...failedImages, url]; }
	let coverScene: HTMLElement;
	let openProgress = $state(0);
	onMount(() => {
		const mobileViewport = window.matchMedia('(max-width: 700px)');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let frame = 0;
		const update = () => {
			if (!mobileViewport.matches || reducedMotion.matches) {
				cancelAnimationFrame(frame);
				openProgress = 0;
				return;
			}
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const scrollRange = coverScene.offsetHeight - window.innerHeight;
				openProgress = scrollRange > 0
					? Math.max(0, Math.min(1, -coverScene.getBoundingClientRect().top / scrollRange))
					: 0;
			});
		};
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update, { passive: true });
		reducedMotion.addEventListener('change', update);
		update();
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			reducedMotion.removeEventListener('change', update);
			cancelAnimationFrame(frame);
		};
	});
</script>

{#snippet photo(url: string, fallback: string, label: string)}
	<img src={failedImages.includes(url) ? asset(fallback) : url} alt={label} loading="lazy" onerror={() => fail(url)} />
{/snippet}

<article class="grand-opening-invite" aria-label={eventTitle || `${brandName} Grand Opening invitation`}
	style="--go-primary: {color(primaryColor, '#10a37b')}; --go-secondary: {color(secondaryColor, '#0f926c')}; --go-font: {bodyFont};">
	<section class="go-cover" bind:this={coverScene} aria-labelledby="go-cover-title"
		style="--go-open-progress: {openProgress}; --go-gate-lift: {openProgress * -130}cqw; --go-envelope-drop: {openProgress * 90 + openProgress * openProgress * 100}cqw; --go-letter-rise: {openProgress * -60}cqw;">
		<div class="go-cover-stage"><div class="go-cover-artwork">
			<div class="go-opening-letter" aria-hidden="true"><span>UNDANGAN EKSKLUSIF</span><strong>Grand Opening</strong><small>{fullDate} · {zone}</small><em>Untuk {recipient}</em></div>
			<div class="go-envelope-body">
				<img class="go-envelope-bottom" src={asset('envelope-bottom')} alt="" fetchpriority="high" />
				<div class="go-cover-host"><span>{recipientPrefix}</span><strong>{recipient}</strong>{#if recipientRole}<em>{recipientRole}</em>{/if}</div>
				<a class="go-scroll-cue" href="#go-invitation-title"><img src={asset('scroll')} alt="" /><span>Scroll ke Bawah</span></a>
			</div>
			<div class="go-envelope-flap">
				<img class="go-envelope-top" src={asset('envelope-top')} alt="" />
				<h1 id="go-cover-title" class="go-cover-title">
					{#if title.toLowerCase() === 'grand opening'}
						<img src={asset('cover-title')} alt="Grand Opening New Office" />
					{:else}<span>{title}</span><small>{text(data.heroSubtitle, 'NEW OFFICE')}</small>{/if}
				</h1>
				<div class="go-cover-tagline">
					{#if !data.eyebrow}<img src={asset('cover-tagline')} alt="New Space • New Energy • New Chapter" />
					{:else if data.eyebrow === 'Satu langkah baru untuk tumbuh bersama'}<img src={asset('cover-tagline')} alt="New Space • New Energy • New Chapter" />
					{:else}{text(data.eyebrow, '')}{/if}
				</div>
				<img class="go-cover-seal" src={asset('seal')} alt="" />
			</div>
		</div></div>
	</section>

	<section class="go-invitation" aria-labelledby="go-invitation-title">
		<h2 id="go-invitation-title"><img src={asset('invitation-title')} alt="Undangan" loading="lazy" /></h2>
		<div class="go-invitation-copy"><p><strong>Dengan penuh sukacita,</strong></p><p>{intro}</p></div>
		<div class="go-building-photo" class:go-building-placeholder={failedImages.includes(buildingImage)}>{@render photo(buildingImage, 'office-front', venueName)}</div>
		<p class="go-photo-caption">Tentang energi baru untuk terus melangkah<br />lebih jauh bersama UMKM Indonesia</p>
	</section>

	<section class="go-journey" aria-labelledby="go-journey-title">
		<p class="go-section-kicker">OUR JOURNEY</p>
		<h2 id="go-journey-title">{storyTitle}</h2>
		<div class="go-video-panel">
			{#if videoEmbedURL}
				<div class="go-video-card go-video-embed">
					<iframe src={videoEmbedURL} title={text(data.videoTitle, 'Perjalanan Kasir Pintar')} loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
				</div>
			{:else if videoURL}
				<a class="go-video-card" href={videoURL} target="_blank" rel="noopener noreferrer" aria-label="Open {text(data.videoTitle, 'Perjalanan Kasir Pintar')}">{@render photo(videoThumbnail, 'journey-poster', 'Perjalanan Kasir Pintar bersama UMKM')}</a>
			{:else}<div class="go-video-card" aria-label="Video preview; video link not yet supplied">{@render photo(videoThumbnail, 'journey-poster', 'Perjalanan Kasir Pintar bersama UMKM')}</div>{/if}
			<p>{#if videoCaption === 'Terus berusaha tumbuh bersama UMKM Indonesia'}Terus berusaha <strong>tumbuh bersama</strong><br />UMKM Indonesia{:else}{videoCaption}{/if}</p>
		</div>
	</section>

	<section class="go-chapter" aria-labelledby="go-chapter-title">
		<div class="go-interior-photo">{@render photo(interiorImage, 'office-meeting', `${venueName} ruang rapat`)}</div>
		<div class="go-chapter-content"><h2 id="go-chapter-title">{chapterTitle}</h2><p>{chapterBody}</p>
			<div class="go-value-grid">{#each values as value, index}<div class="go-value-card"><img src={asset(valueIcons[index])} alt="" loading="lazy" /><span>{#if value === valueDefaults[index]}{value.slice(0, -valueEmphasis[index].length)}<strong>{valueEmphasis[index]}</strong>{:else}{value}{/if}</span></div>{/each}</div>
		</div>
	</section>

	<section class="go-details" aria-labelledby="go-details-title">
		<div class="go-office-photo">{@render photo(workspaceImage, 'office-workspace', `${venueName} ruang kerja`)}</div>
		<h2 id="go-details-title">Detail Acara</h2>
		<div class="go-detail-list">
			<div class="go-detail-row"><img src={asset('detail-calendar')} alt="" loading="lazy" /><p><strong>{weekday}</strong><span>{fullDate}</span></p></div>
			<div class="go-detail-row"><img src={asset('detail-clock')} alt="" loading="lazy" /><p><strong>{time} {zone}</strong><span>– {endTime}</span></p></div>
			<div class="go-detail-row"><img src={asset('detail-location')} alt="" loading="lazy" /><p><strong>{venueName}</strong><span>{mapsLabel}</span></p></div>
		</div>
		<div class="go-map-card">
			<div class="go-map-image">
				{#if mapEmbedURL}
					<iframe src={mapEmbedURL} title={`Peta lokasi: ${mapsLabel}`} loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
				{:else}
					{@render photo(mapImage, 'maps-preview', `Pratinjau peta: ${mapsLabel}`)}
				{/if}
			</div>
			<a class="go-map-link" href={mapURL} target="_blank" rel="noopener noreferrer">Lihat Lokasi di Google Maps</a>
		</div>
	</section>

	<section class="go-rsvp-section" aria-labelledby="go-rsvp-title">
		<p class="go-section-kicker">RSVP</p><h2 id="go-rsvp-title">Konfirmasi<br />Kehadiran Anda</h2>
		<section id="rsvp-form" class="go-response" aria-label="RSVP">
			{#if rsvpContent}
				{@render rsvpContent()}
			{:else}
				<div class="go-form-preview">
					<label>Nama Lengkap *<input disabled /></label>
					{#if rsvpPreview.collectOrganization}<label>Instansi / Perusahaan (optional)<input disabled placeholder="Company or organization" /></label>{/if}
					{#each rsvpPreview.questions as question (question.id)}
						<div class="go-preview-question">
							<p class="go-preview-question-label">{question.label}{question.required ? ' *' : ''}</p>
							{#if question.type === 'text'}<input disabled placeholder="Your answer" />
							{:else}{#each question.options as option}<p class="go-preview-option">{question.type === 'checkbox' ? '□' : '◯'} &nbsp; {option}</p>{/each}{/if}
						</div>
					{/each}
					{#if rsvpPreview.showEmail}<label>Email Address {rsvpPreview.emailRequired ? '*' : '(optional)'}<input type="email" disabled placeholder="you@example.com" /></label>{/if}
					{#if rsvpPreview.showPhone}<label>Phone Number {rsvpPreview.phoneRequired ? '*' : '(optional)'}<input type="tel" disabled placeholder="+628123456789" /></label>{/if}
					{#if rsvpPreview.contactChoiceRequired}<p>Provide either an email address or a phone number.</p>{/if}
					<p>Konfirmasi Kehadiran *</p>
					<p class="go-preview-option">◯ &nbsp; Ya, Saya Akan Hadir</p>
					<p class="go-preview-option">◯ &nbsp; Maaf, Saya Tidak Bisa Hadir</p>
					<button disabled>KIRIM RSVP</button>
				</div>
			{/if}
		</section>
	</section>

	<footer class="go-footer">
		<div class="go-footer-logo">{#if brandName === 'Kasir Pintar'}<img src={asset('brand-logo')} alt="Kasir Pintar" loading="lazy" />{:else}{brandName}{/if}</div>
		<h2 class="go-see-you"><img src={asset('closing-title')} alt="See You at Our New Office" loading="lazy" /></h2>
		<p class="go-closing-copy">{closingBody}</p>
		<nav class="go-socials" aria-label="Media sosial Kasir Pintar">
			{#each socials as social}
				<a href={social.url} target="_blank" rel="noopener noreferrer" aria-label="Kasir Pintar di {social.name}"><img src={asset(social.icon)} alt="" loading="lazy" /></a>
			{/each}
		</nav>
		<a class="go-website" href="https://kasirpintar.co.id/" target="_blank" rel="noopener noreferrer">www.<strong>kasirpintar</strong>.co.id</a>
		<div class="go-footer-photo">{@render photo(footerImage, 'office-closing', `${venueName} tampak depan`)}</div>
	</footer>
</article>

<style>
	@font-face { font-family: 'Grand Opening Script'; src: url('/fonts/grand-opening-great-vibes.ttf') format('truetype'); font-display: swap; }
	@font-face { font-family: 'Grand Opening Sans'; src: url('/fonts/plus-jakarta-sans-400.woff2') format('woff2'); font-weight: 400; font-display: swap; }
	@font-face { font-family: 'Grand Opening Sans'; src: url('/fonts/plus-jakarta-sans-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }
	.grand-opening-invite { container-type: inline-size; width: 100%; max-width: 1080px; margin: auto; overflow: clip; background: #f7f7f7; color: #303030; font-family: var(--go-font), sans-serif; }
	.grand-opening-invite :global(*) { box-sizing: border-box; }
	h1, h2, p { margin: 0; }
	img { display: block; width: 100%; height: auto; }
	a { color: inherit; text-decoration: none; }
	a:focus-visible { outline: 3px solid #ffbf47; outline-offset: 4px; }
	section, footer { position: relative; }
	h2 { font-weight: 700; font-size: 5.9cqw; line-height: 1.18; }
	.go-cover { height: 177.778cqw; color: #fff; text-align: center; }
	.go-cover-stage { display: contents; }
	.go-cover-artwork { position: absolute; inset: 0; container-type: inline-size; background: #088f70 url('/invite/grand-opening/envelope-bottom.webp') center / 100% 100% no-repeat; }
	.go-envelope-body { position: absolute; z-index: 2; inset: 0; container-type: inline-size; transform: translate3d(0, var(--go-envelope-drop, 0cqw), 0); transform-origin: 50% 0%; will-change: transform; }
	.go-envelope-flap { position: absolute; z-index: 3; inset: 0 auto auto 0; width: 100%; height: 177.778cqw; container-type: inline-size; transform: translate3d(0, var(--go-gate-lift, 0cqw), 0); will-change: transform; }
	.go-envelope-bottom, .go-envelope-top { position: absolute; inset: 0 auto auto 0; width: 100%; pointer-events: none; }
	.go-envelope-bottom { z-index: 0; }
	.go-opening-letter { display: none; }
	.go-cover-title { position: absolute; top: 10.185cqw; left: 17.685%; width: 64.63%; font-family: 'Grand Opening Script', cursive; font-size: 14cqw; font-weight: 400; line-height: 1; }
	.go-cover-title small { display: block; font-family: 'Grand Opening Sans', sans-serif; font-size: 4.2cqw; font-weight: 700; }
	.go-cover-tagline { position: absolute; top: 59.63cqw; left: 7.685%; width: 84.54%; font-size: 4.6cqw; line-height: 1.2; font-weight: 700; text-shadow: .3cqw .5cqw #087d63; }
	.go-cover-seal { position: absolute; top: 78.7cqw; left: 33.15%; width: 37.87%; }
	.go-cover-host { position: absolute; top: 119.8cqw; left: 5%; width: 90%; }
	.go-cover-host > span { display: block; font-size: 2.95cqw; font-weight: 700; }
	.go-cover-host strong { display: block; font-family: 'Grand Opening Script', cursive; font-size: 11.5cqw; font-weight: 400; line-height: 1.3; margin-top: 3cqw; overflow-wrap: anywhere; }
	.go-cover-host em { display: block; font-size: 3cqw; line-height: 1.3; }
	.go-scroll-cue { position: absolute; top: 150.2cqw; left: 25%; width: 50%; display: grid; justify-items: center; gap: 3.5cqw; font-size: 3cqw; }
	.go-scroll-cue img { width: 8.426cqw; }
	.go-invitation { min-height: 149.444cqw; text-align: center; padding-top: 8.8cqw; }
	.go-invitation h2 { width: 66.2%; margin: 0 auto; scroll-margin-top: 1rem; }
	.go-invitation-copy { width: 84%; margin: 6cqw auto 0; font-size: 4cqw; line-height: 1.18; position: relative; z-index: 1; }
	.go-invitation-copy p + p { margin-top: 1.8cqw; }
	.go-building-photo { width: 100%; margin-top: 1.8cqw; }
	.go-photo-caption { padding: 10.5cqw 5% 7.8cqw; font-size: 4cqw; line-height: 1.18; }
	.go-journey { padding: 10.8cqw 7.5% 7.5cqw; text-align: center; }
	.go-section-kicker { font-size: 2.9cqw; font-weight: 700; line-height: 1.25; }
	.go-journey h2 { color: #109873; margin-top: 3.5cqw; }
	.go-video-panel { margin-top: 6cqw; padding: 9cqw 3.6cqw 8.6cqw; background: url('/invite/grand-opening/journey-panel.webp') center/100% 100% no-repeat; border-radius: 3cqw; color: white; }
	.go-video-card { display: block; }
	.go-video-embed { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 2cqw; }
	.go-video-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
	.go-video-panel p { margin: 8.5cqw auto 0; font-size: 4cqw; line-height: 1.18; max-width: 68cqw; }
	.go-chapter { min-height: 175.185cqw; background: var(--go-primary); text-align: center; color: white; }
	.go-interior-photo { width: 100%; }
	.go-chapter-content { margin-top: -1.5cqw; position: relative; padding: 0 8% 3cqw; }
	.go-chapter-content > p { font-size: 4cqw; line-height: 1.18; margin: 3.5cqw auto 7.5cqw; }
	.go-value-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5.3cqw 9cqw; }
	.go-value-card { display: flex; align-items: center; flex-direction: column; font-size: 3.2cqw; line-height: 1.2; }
	.go-value-card img { width: 18.6cqw; margin-bottom: 1.4cqw; }
	.go-value-card span { max-width: 30cqw; text-wrap: balance; }
	.go-details { min-height: 175.185cqw; padding-top: 7.8cqw; color: white; background: var(--go-primary); }
	.go-details h2 { text-align: center; position: relative; }
	.go-detail-list { width: 73%; margin: 6cqw 5% 0 22%; position: relative; }
	.go-detail-row { display: flex; gap: 3.2cqw; align-items: center; margin-bottom: 1.4cqw; }
	.go-detail-row img { width: 13.15cqw; flex: 0 0 13.15cqw; }
	.go-detail-row p { font-size: 4cqw; line-height: 1.18; }
	.go-detail-row strong, .go-detail-row span { display: block; }
	.go-detail-row:last-child span { font-size: 3.2cqw; }
	.go-map-card { position: relative; z-index: 2; display: block; width: 74.26%; margin: 6cqw auto 0; background: url('/invite/grand-opening/maps-frame.webp') center/100% 100% no-repeat; aspect-ratio: 802 / 415; padding: 1.8cqw; }
	.go-map-image { position: relative; height: 100%; overflow: hidden; border-radius: 2cqw; }
	.go-map-image img { height: 100%; object-fit: cover; }
	.go-map-image iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
	.go-map-link { position: absolute; z-index: 3; bottom: 1.8cqw; left: 21.75%; width: 56.5%; aspect-ratio: 453 / 88; display: flex; align-items: center; justify-content: center; background: url('/invite/grand-opening/maps-button.webp') center/100% 100% no-repeat; color: inherit; font-size: 2.6cqw; font-weight: 700; text-decoration: none; white-space: nowrap; transition: filter .2s ease, transform .2s ease; }
	.go-map-link:focus-visible { outline: 3px solid #ffbf47; outline-offset: 3px; }
	.go-map-card:hover .go-map-link, .go-response :global(button[type='submit']:hover) { filter: brightness(1.08); transform: translateY(-2px); }
	.go-office-photo { position: absolute; z-index: 0; bottom: 0; left: 0; width: 100%; pointer-events: none; }
	.go-rsvp-section { padding: 4.7cqw 8% 6cqw; text-align: center; }
	.go-rsvp-section h2 { color: #109873; margin: 2cqw 0 6cqw; }
	.go-response { text-align: left; }
	.go-response :global(> div) { width: 100%; max-width: none; }
	.go-response :global(.bg-surface) { background: url('/invite/grand-opening/rsvp-panel.webp') center/100% 100% no-repeat; border: 0; border-radius: 3cqw; box-shadow: none; padding: 6cqw 7.5cqw; }
	.go-response :global(form > div > label), .go-response :global(legend), .go-response :global(form .space-y-5 > div > label) { color: white; font-size: clamp(14px, 3.2cqw, 34px); line-height: 1.2; }
	.go-response :global(input:not([type='radio']):not([type='checkbox']):not([aria-hidden='true'])), .go-response :global(textarea), .go-response :global(select) { background: #f7f7f7; border-radius: 3cqw; color: #303030; padding: 2cqw; min-height: 44px; font-size: max(16px, 3cqw); }
	.go-response :global(.go-public-form-heading) { display: none; }
	.go-response :global(.go-attendance-options) { grid-template-columns: 1fr; }
	.go-response :global(.rsvp-option) { background: #f7f7f7; color: #303030; border-radius: 3cqw; padding: 1.6cqw; flex-direction: row; justify-content: flex-start; gap: 1.5cqw; min-height: 44px; }
	.go-response :global(.rsvp-option span) { font-size: max(14px, 3cqw); }
	.go-response :global(.rsvp-option-selected) { outline: 3px solid white; outline-offset: 3px; background: #ddf6eb; }
	.go-response :global(.rsvp-option svg) { flex-shrink: 0; margin: 0; }
	.go-response :global(button[type='submit']), .go-form-preview button { display: block; background: var(--go-secondary); color: white; border: .45cqw solid #f7f7f7; border-radius: 8cqw; padding: 1.5cqw 6cqw; font-size: max(16px, 4cqw); font-weight: 700; margin: 4cqw auto 0; width: auto; min-height: 44px; }
	.go-response :global(input:focus-visible), .go-response :global(button:focus-visible) { outline: 3px solid #ffbf47; outline-offset: 3px; }
	.go-form-preview { background: url('/invite/grand-opening/rsvp-panel.webp') center/100% 100% no-repeat; padding: 6cqw 7.5cqw; color: white; border-radius: 3cqw; font-size: 3.2cqw; }
	.go-form-preview label { display: block; margin-bottom: 6cqw; }
	.go-preview-question { margin-bottom: 6cqw; }
	.go-preview-question-label { margin-bottom: 2cqw; }
	.go-form-preview input { display: block; width: 100%; height: 11cqw; border: 0; border-radius: 3cqw; background: #f7f7f7; margin-top: 2cqw; }
	.go-preview-option { margin-top: 2cqw; padding: 1.5cqw; background: #f7f7f7; color: #303030; border-radius: 3cqw; }
	.go-footer { min-height: 159.074cqw; padding-top: 8.4cqw; text-align: center; background: #f7f7f7; }
	.go-footer-logo { width: 34.26%; margin: auto; font-size: 4cqw; font-weight: 700; }
	.go-see-you { width: 53.43%; margin: 9.8cqw auto 0; }
	.go-closing-copy { margin: 7.3cqw auto 0; width: 58%; font-size: 3.2cqw; line-height: 1.18; text-wrap: balance; }
	.go-socials { display: flex; justify-content: center; align-items: center; gap: 11.5cqw; margin-top: 11.8cqw; }
	.go-socials img { width: 9.72cqw; }
	.go-website { display: inline-block; font-size: 3.2cqw; margin-top: 7.4cqw; }
	.go-footer-photo { margin-top: 1.3cqw; }
	@media (max-width: 700px) {
		.go-cover { height: 180svh; min-height: 0; background: #088f70; }
		.go-cover-stage { position: sticky; top: 0; display: grid; place-items: center; width: 100vw; height: 100svh; margin-left: calc(50% - 50vw); overflow: hidden; background: #088f70 url('/invite/grand-opening/envelope-bottom.webp') center / cover no-repeat; }
		.go-cover-artwork { position: relative; inset: auto; width: min(100%, 56.25svh); aspect-ratio: 9 / 16; overflow: hidden; background: #088f70; box-shadow: 0 24px 70px rgb(0 45 34 / 24%); }
		.go-envelope-body { will-change: transform; }
		.go-envelope-flap { will-change: transform; }
		.go-opening-letter { position: absolute; z-index: 1; bottom: 14cqw; left: 11%; width: 78%; min-height: 79cqw; display: grid; align-content: center; justify-items: center; gap: 2.5cqw; padding: 5cqw 4cqw; background: #fffdf4; color: #16785f; border: 1px solid rgb(190 157 91 / 60%); border-radius: 1.8cqw; box-shadow: 0 1.8cqw 5cqw rgb(0 42 33 / 24%); text-align: center; opacity: 1; transform: translate3d(0, var(--go-letter-rise, 0cqw), 0); will-change: transform; }
		.go-opening-letter::before { content: ''; position: absolute; top: 3cqw; left: 50%; width: 16cqw; height: .4cqw; background: #c7a66a; transform: translateX(-50%); }
		.go-opening-letter span { font-size: 2.5cqw; font-weight: 700; letter-spacing: .28em; }
		.go-opening-letter strong { font-family: 'Grand Opening Script', cursive; font-size: 8cqw; font-weight: 400; line-height: 1; }
		.go-opening-letter small { font-size: 2.8cqw; }
		.go-opening-letter em { font-size: 2.7cqw; font-style: normal; }
		.go-cover-host, .go-scroll-cue { position: absolute; z-index: 1; }
		.go-cover-seal { filter: drop-shadow(0 8px 14px rgb(0 45 34 / 26%)); }
		.go-map-card { filter: drop-shadow(0 12px 22px rgb(0 45 34 / 16%)); }
	}
	@media (max-width: 700px) and (prefers-reduced-motion: reduce) {
		.go-cover { height: auto; }
		.go-cover-stage { position: static; display: contents; }
		.go-cover-artwork { position: relative; width: 100%; aspect-ratio: 9 / 16; }
		.go-envelope-body { transform: none; will-change: auto; }
		.go-envelope-flap { transform: none; will-change: auto; }
		.go-opening-letter { display: none; }
	}
	@media (prefers-reduced-motion: no-preference) { .go-scroll-cue img { animation: go-scroll 2s ease-in-out infinite; } }
	@keyframes go-scroll { 50% { transform: translateY(.6cqw); } }
</style>
