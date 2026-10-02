<script lang="ts">
	import type { Snippet } from 'svelte';
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
	}

	interface GrandOpeningData extends Record<string, unknown> {
		brandName?: string;
		logoLabel?: string;
		recipientName?: string;
		recipientPrefix?: string;
		hostName?: string;
		hostRole?: string;
		eyebrow?: string;
		cityName?: string;
		venueName?: string;
		heroTitle?: string;
		heroSubtitle?: string;
		intro?: string;
		storyTitle?: string;
		storyBody?: string;
		videoTitle?: string;
		videoCaption?: string;
		chapterTitle?: string;
		chapterBody?: string;
		closingTitle?: string;
		closingBody?: string;
		sinceLabel?: string;
		values?: unknown;
		heroImage?: unknown;
		buildingImage?: unknown;
		storyImage?: unknown;
		interiorImage?: unknown;
		videoThumbnail?: unknown;
		mapImage?: unknown;
		footerImage?: unknown;
		videoUrl?: unknown;
		mapsUrl?: unknown;
		mapsLabel?: string;
		instagramUrl?: unknown;
		linkedinUrl?: unknown;
		youtubeUrl?: unknown;
		tiktokUrl?: unknown;
	}

	let {
		rsvpContent,
		heading,
		body,
		footer,
		primaryColor,
		secondaryColor,
		font,
		eventTitle,
		eventDescription = '',
		eventDate,
		endDate,
		eventLocation,
		timezone,
		customData = '{}',
		recipientName = ''
	}: Props = $props();

	function parseCustomData(raw: string | Record<string, unknown>): GrandOpeningData {
		if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
			return raw as GrandOpeningData;
		}
		if (typeof raw !== 'string' || !raw.trim()) return {};

		try {
			const parsed: unknown = JSON.parse(raw);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as GrandOpeningData;
			}
		} catch {
			// Invalid optional custom data should never prevent the invitation from rendering.
		}
		return {};
	}

	function readText(value: unknown, fallback: string): string {
		return typeof value === 'string' && value.trim() ? value.trim() : fallback;
	}

	function safeHex(value: string, fallback: string): string {
		return /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim()) ? value.trim() : fallback;
	}

	function safeURL(value: unknown): string {
		if (typeof value !== 'string' || !value.trim()) return '';
		const trimmed = value.trim();
		if (/[()'"<>\\]/.test(trimmed)) return '';
		if (trimmed.startsWith('/')) return trimmed.startsWith('//') ? '' : trimmed;
		try {
			const parsed = new URL(trimmed);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : '';
		} catch {
			return '';
		}
	}

	function formatDateParts(dateStr: string, tz?: string) {
		const fallback = { weekday: 'Save the date', day: '--', month: '---', year: '', time: '' };
		if (!dateStr) return fallback;

		try {
			const date = new Date(dateStr);
			if (Number.isNaN(date.getTime())) return fallback;
			const options = (extra: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
				...extra,
				...(tz ? { timeZone: tz } : {})
			});
			const weekday = new Intl.DateTimeFormat('id-ID', options({ weekday: 'long' }))
				.format(date)
				.replace(/^Jumat$/, "Jum'at");
			return {
				weekday,
				day: new Intl.DateTimeFormat('id-ID', options({ day: '2-digit' })).format(date),
				month: new Intl.DateTimeFormat('id-ID', options({ month: 'short' }))
					.format(date)
					.replace('.', ''),
				year: new Intl.DateTimeFormat('id-ID', options({ year: 'numeric' })).format(date),
				time: new Intl.DateTimeFormat('id-ID', options({ hour: '2-digit', minute: '2-digit' }))
					.format(date)
					.replace('.', ':')
			};
		} catch {
			return fallback;
		}
	}

	function formatTimezoneLabel(tz?: string): string {
		const labels: Record<string, string> = {
			'Asia/Jakarta': 'WIB',
			'Asia/Makassar': 'WITA',
			'Asia/Jayapura': 'WIT'
		};
		if (tz && labels[tz]) return labels[tz];
		if (!tz) return 'local time';
		const parts = tz.split('/');
		return parts[parts.length - 1].replace(/_/g, ' ');
	}

	const data = $derived.by(() => parseCustomData(customData));
	const brandPrimary = $derived(safeHex(primaryColor, '#0ca678'));
	const brandSecondary = $derived(safeHex(secondaryColor, '#087f5b'));
	const dateParts = $derived(formatDateParts(eventDate, timezone));
	const endDateParts = $derived(endDate ? formatDateParts(endDate, timezone) : null);
	const timezoneLabel = $derived(formatTimezoneLabel(timezone));
	const brandName = $derived(readText(data.brandName, 'Kasir Pintar'));
	const logoLabel = $derived(readText(data.logoLabel, brandName));
	const venueName = $derived(readText(data.venueName, 'Head Office Kasir Pintar'));
	const cityName = $derived(readText(data.cityName, 'Surabaya'));
	const heroTitle = $derived(readText(data.heroTitle, heading && heading !== "You're Invited!" ? heading : 'Grand Opening'));
	const heroTitleWords = $derived(heroTitle.split(/\s+/).filter(Boolean));
	const heroSubtitle = $derived(readText(data.heroSubtitle, 'NEW OFFICE'));
	const eyebrow = $derived(readText(data.eyebrow, 'NEW SPACE  ·  NEW ENERGY  ·  NEW CHAPTER'));
	const recipient = $derived(readText(recipientName, readText(data.recipientName, 'Tamu Undangan')));
	const recipientPrefix = $derived(readText(data.recipientPrefix, 'Kepada Yth.'));
	const hostName = $derived(readText(data.hostName, recipient));
	const hostRole = $derived(readText(data.hostRole, recipientPrefix));
	const intro = $derived(
		readText(
			data.intro,
			body && body !== 'Join us for a wonderful celebration.'
				? body
				: 'Dengan penuh sukacita, kami mengundang Bapak/Ibu untuk hadir dalam momen spesial peresmian kantor baru Kasir Pintar.'
		)
	);
	const storyTitle = $derived(readText(data.storyTitle, 'Perjalanan Kasir Pintar Bersama UMKM Indonesia'));
	const storyBody = $derived(
		readText(
			data.storyBody,
			eventDescription || 'Terus berusaha tumbuh bersama UMKM Indonesia.'
		)
	);
	const videoTitle = $derived(readText(data.videoTitle, 'Perjalanan Kasir Pintar'));
	const videoCaption = $derived(readText(data.videoCaption, 'Terus berusaha tumbuh bersama UMKM Indonesia'));
	const chapterTitle = $derived(readText(data.chapterTitle, 'A New Chapter Begins'));
	const chapterBody = $derived(
		readText(
			data.chapterBody,
			'Kantor baru ini menjadi ruang untuk berkolaborasi dan menghadirkan energi baru untuk inovasi dalam melanjutkan perjalanan Kasir Pintar.'
		)
	);
	const closingBody = $derived(readText(data.closingBody, footer || 'Terimakasih telah menjadi bagian dari perjalanan kami.'));
	const sinceLabel = $derived(readText(data.sinceLabel, 'sejak 2013'));
	const heroImage = $derived(safeURL(data.heroImage));
	const buildingImage = $derived(safeURL(data.buildingImage) || heroImage);
	const storyImage = $derived(safeURL(data.storyImage));
	const interiorImage = $derived(safeURL(data.interiorImage));
	const videoThumbnail = $derived(safeURL(data.videoThumbnail) || storyImage);
	const mapImage = $derived(safeURL(data.mapImage));
	const footerImage = $derived(safeURL(data.footerImage) || buildingImage);
	const videoURL = $derived(safeURL(data.videoUrl));
	const mapURL = $derived(
		safeURL(data.mapsUrl) ||
		(eventLocation
			? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}`
			: '')
	);
	const mapLabel = $derived(readText(data.mapsLabel, eventLocation || `${venueName}, ${cityName}`));
	const instagramURL = $derived(safeURL(data.instagramUrl));
	const linkedinURL = $derived(safeURL(data.linkedinUrl));
	const youtubeURL = $derived(safeURL(data.youtubeUrl));
	const tiktokURL = $derived(safeURL(data.tiktokUrl));
	const values = $derived.by(() => {
		const configured = data.values;
		if (Array.isArray(configured)) {
			const cleaned = configured.filter(
				(value): value is string => typeof value === 'string' && Boolean(value.trim())
			);
			if (cleaned.length > 0) return [...cleaned, 'Langkah Lebih Jauh untuk UMKM', 'Ruang untuk Berkolaborasi', 'Energi Baru untuk Berinovasi', 'Lingkungan yang Lebih Nyaman'].slice(0, 4);
		}
		return ['Ruang untuk Berkolaborasi', 'Energi Baru untuk Berinovasi', 'Lingkungan yang Lebih Nyaman', 'Langkah Lebih Jauh untuk UMKM'];
	});

	let buildingImageFailed = $state(false);
	let storyImageFailed = $state(false);
	let interiorImageFailed = $state(false);
	let videoImageFailed = $state(false);
	let mapImageFailed = $state(false);
	let footerImageFailed = $state(false);
	$effect(() => { buildingImage; buildingImageFailed = false; });
	$effect(() => { storyImage; storyImageFailed = false; });
	$effect(() => { interiorImage; interiorImageFailed = false; });
	$effect(() => { videoThumbnail; videoImageFailed = false; });
	$effect(() => { mapImage; mapImageFailed = false; });
	$effect(() => { footerImage; footerImageFailed = false; });
</script>

<article
	class="grand-opening-invite"
	style="--go-primary: {brandPrimary}; --go-secondary: {brandSecondary}; --go-font: {font || 'inherit'};"
	aria-label="{brandName} Grand Opening invitation"
>
	<div class="go-paper-texture" aria-hidden="true"></div>

	<section class="go-cover" aria-labelledby="go-cover-title">
		<div class="go-cover-logo"><span class="go-logo-mark">KP</span><span>{logoLabel}</span></div>
		<div class="go-cover-heading">
			<p class="go-cover-kicker">{heroSubtitle}</p>
			<h1 id="go-cover-title">
				{#each heroTitleWords as word}
					<span>{word}</span>
				{/each}
			</h1>
			<div class="go-new-office">NEW OFFICE</div>
		</div>
		<p class="go-cover-tagline">• {eyebrow.replace(/\s*·\s*/g, '  •  ')} •</p>
		<div class="go-cover-seal" aria-hidden="true">
			<div class="go-seal-ring go-seal-ring-outer"></div>
			<div class="go-seal-ring go-seal-ring-inner"></div>
			<div class="go-seal-core"><span>KP</span><b>+</b></div>
		</div>
		<div class="go-cover-host">
			<span>{hostRole}</span>
			<strong>{hostName}</strong>
		</div>
		<div class="go-scroll-cue"><span></span><small>Scroll ke Bawah</small></div>
	</section>

	<section class="go-invitation" aria-labelledby="go-invitation-title">
		<div class="go-script-title" id="go-invitation-title">Undangan</div>
		<p class="go-invitation-lead">Dengan penuh sukacita,</p>
		<p class="go-invitation-copy">{intro}</p>

		<div class="go-building-photo">
			{#if buildingImage && !buildingImageFailed}
				<img src={buildingImage} alt="{venueName} placeholder" onerror={() => (buildingImageFailed = true)} />
			{:else}
				<div class="go-building-placeholder" role="img" aria-label="Placeholder image of the new office building">
					<div class="go-building-sky"></div>
					<div class="go-building-shape"><i></i><i></i><i></i><i></i><i></i><i></i></div>
					<div class="go-building-ground"></div>
				</div>
			{/if}
		</div>
		<p class="go-photo-caption">Tentang energi baru untuk terus melangkah lebih jauh bersama UMKM Indonesia</p>

		<div class="go-journey">
			<p class="go-section-kicker">OUR JOURNEY</p>
			<h2>{storyTitle}</h2>
			<p>{storyBody}</p>
			<div class="go-story-line"><span></span>{brandName} · {sinceLabel}</div>
		</div>

		{#if videoURL}
			<a class="go-video-card" href={videoURL} target="_blank" rel="noopener noreferrer" aria-label="Open {videoTitle}">
				{#if videoThumbnail && !videoImageFailed}<img src={videoThumbnail} alt="{videoTitle} placeholder" onerror={() => (videoImageFailed = true)} />{/if}
				<span class="go-video-wash"></span>
				<span class="go-play-button" aria-hidden="true">▶</span>
				<span class="go-video-caption">{videoCaption}</span>
			</a>
		{:else}
			<div class="go-video-card go-video-placeholder" role="img" aria-label="Placeholder for {videoTitle}">
				{#if videoThumbnail && !videoImageFailed}<img src={videoThumbnail} alt="{videoTitle} placeholder" onerror={() => (videoImageFailed = true)} />{/if}
				<span class="go-video-wash"></span>
				<span class="go-play-button" aria-hidden="true">▶</span>
				<span class="go-video-caption">{videoCaption}</span>
			</div>
		{/if}
	</section>

	<section class="go-chapter" aria-labelledby="go-chapter-title">
		<div class="go-interior-photo">
			{#if interiorImage && !interiorImageFailed}
				<img src={interiorImage} alt="{venueName} interior placeholder" onerror={() => (interiorImageFailed = true)} />
			{:else}
				<div class="go-interior-placeholder" role="img" aria-label="Placeholder image of the new office interior">
					<div class="go-window"></div>
					<div class="go-desk go-desk-one"></div><div class="go-desk go-desk-two"></div>
					<div class="go-chair go-chair-one"></div><div class="go-chair go-chair-two"></div>
				</div>
			{/if}
		</div>
		<div class="go-chapter-content">
			<p class="go-section-kicker">A NEW CHAPTER BEGINS</p>
			<h2 id="go-chapter-title">{chapterTitle}</h2>
			<p>{chapterBody}</p>
			<div class="go-value-grid">
				{#each values as value, index}
					<div class="go-value-card">
						<span class="go-value-icon" aria-hidden="true">{['⌂', '✦', '⌁', '↗'][index]}</span>
						<span>{value}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="go-details" aria-labelledby="go-details-title">
		<p class="go-section-kicker">DETAIL ACARA</p>
		<h2 id="go-details-title">Detail Acara</h2>
		<div class="go-detail-list">
			<div class="go-detail-row"><span class="go-detail-icon" aria-hidden="true">▣</span><span><b>{dateParts.weekday}</b><small>{dateParts.day} {dateParts.month} {dateParts.year}</small></span></div>
			<div class="go-detail-row"><span class="go-detail-icon" aria-hidden="true">◷</span><span><b>{dateParts.time} {timezoneLabel}</b><small>{#if endDateParts}{endDateParts.time} {timezoneLabel}{:else}– Selesai{/if}</small></span></div>
			<div class="go-detail-row"><span class="go-detail-icon" aria-hidden="true">⌖</span><span><b>{venueName}</b><small>{mapLabel}</small></span></div>
		</div>

		{#if mapURL}
			<a class="go-map-card" href={mapURL} target="_blank" rel="noopener noreferrer" aria-label="Open event location in Google Maps">
				{#if mapImage && !mapImageFailed}<img src={mapImage} alt="Map placeholder" onerror={() => (mapImageFailed = true)} />{:else}<div class="go-map-placeholder"><span class="go-map-grid"></span><i></i><b></b><em>MAP PLACEHOLDER</em></div>{/if}
				<span class="go-map-link">Lihat Lokasi di Google Maps ↗</span>
			</a>
		{:else}
			<div class="go-map-card"><div class="go-map-placeholder"><span class="go-map-grid"></span><i></i><b></b><em>MAP PLACEHOLDER</em></div></div>
		{/if}

		<div class="go-office-photo">
			{#if footerImage && !footerImageFailed}
				<img src={footerImage} alt="{venueName} exterior placeholder" onerror={() => (footerImageFailed = true)} />
			{:else}
				<div class="go-office-placeholder" role="img" aria-label="Placeholder image of the event office"></div>
			{/if}
		</div>
	</section>

	<section class="go-rsvp-intro" aria-labelledby="go-rsvp-title">
		<p class="go-section-kicker">RSVP</p>
		<h2 id="go-rsvp-title">Konfirmasi<br /><em>Kehadiran Anda</em></h2>
		<p>{closingBody}</p>
		<a class="go-rsvp-link" href="#rsvp-form">Kirim RSVP <span aria-hidden="true">↓</span></a>
	</section>
	{#if rsvpContent}
		<section id="rsvp-form" class="go-response" aria-label="RSVP">
			{@render rsvpContent()}
		</section>
	{/if}

	<footer class="go-footer">
		<div class="go-footer-logo"><span class="go-logo-mark">KP</span>{logoLabel}</div>
		<div class="go-see-you">See You <small>at our New Office</small></div>
		<p>{closingBody}</p>
		<nav class="go-socials" aria-label="Social links">
			{#if instagramURL}<a href={instagramURL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">◎</a>{/if}
			{#if linkedinURL}<a href={linkedinURL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>{/if}
			{#if youtubeURL}<a href={youtubeURL} target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>{/if}
			{#if tiktokURL}<a href={tiktokURL} target="_blank" rel="noopener noreferrer" aria-label="TikTok">♪</a>{/if}
			{#if !instagramURL && !linkedinURL && !youtubeURL && !tiktokURL}<span>{brandName}</span>{/if}
		</nav>
		<span class="go-website">www.kasirpintar.co.id</span>
		<div class="go-footer-photo">
			{#if footerImage && !footerImageFailed}
				<img src={footerImage} alt={venueName} loading="lazy" onerror={() => (footerImageFailed = true)} />
			{:else}
				<div class="go-office-placeholder" role="img" aria-label="Office photo placeholder"></div>
			{/if}
		</div>
	</footer>
</article>

<style>
	@font-face { font-family: 'Grand Opening Script'; src: url('/fonts/grand-opening-great-vibes.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
	.go-response { display: flex; flex-direction: column; align-items: center; padding: 2rem 1.25rem; background: var(--go-green); }
	.go-response :global(button[type='submit']) { background: #087f5b; }
	.go-response :global(button:focus-visible), .go-response :global(input:focus-visible) { outline: 2px solid #075c45; outline-offset: 3px; }
	.go-response :global(> div) { max-width: 32rem; }
	.go-response :global(button.underline) { color: white; }
	.grand-opening-invite {
		--go-ink: #075c45;
		--go-deep: #006e52;
		--go-green: var(--go-primary, #0ca678);
		--go-light: #e6f7ef;
		--go-white: #fbfffd;
		position: relative;
		isolation: isolate;
		overflow: hidden;
		width: 100%;
		max-width: 48rem;
		margin: 0 auto;
		background: var(--go-white);
		border-radius: 1.5rem;
		box-shadow: 0 1.5rem 4rem rgba(0, 93, 69, 0.18);
		color: var(--go-ink);
		font-family: var(--go-font), var(--font-body);
	}

	.go-paper-texture {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		opacity: 0.18;
		background-image: radial-gradient(rgba(0, 108, 80, 0.18) 0.5px, transparent 0.6px);
		background-size: 5px 5px;
		mix-blend-mode: multiply;
	}

	.go-cover,
	.go-invitation,
	.go-chapter,
	.go-details,
	.go-rsvp-intro,
	.go-footer {
		position: relative;
		padding: clamp(2.5rem, 7vw, 6rem) clamp(1.25rem, 8vw, 7rem);
	}

	.go-cover {
		display: flex;
		min-height: clamp(39rem, 145vw, 75rem);
		align-items: center;
		flex-direction: column;
		justify-content: flex-start;
		background: radial-gradient(circle at 50% 39%, rgba(117, 224, 171, 0.26), transparent 17%), linear-gradient(180deg, var(--go-primary, #10ad80) 0%, var(--go-secondary, #008d69) 52%, #006b51 100%);
		color: white;
		text-align: center;
	}

	.go-cover::before,
	.go-cover::after {
		position: absolute;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		content: '';
		pointer-events: none;
	}

	.go-cover::before { inset: 12% -15% 20%; transform: rotate(-22deg); }
	.go-cover::after { inset: 28% -12% 4%; transform: rotate(28deg); }

	.go-cover-logo,
	.go-footer-logo {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.go-cover-logo { position: relative; z-index: 1; opacity: 0.92; }

	.go-logo-mark {
		display: grid;
		width: 1.35rem;
		height: 1.35rem;
		place-items: center;
		border: 1px solid currentColor;
		border-radius: 0.3rem;
		font-size: 0.46rem;
		letter-spacing: 0;
	}

	.go-cover-heading { position: relative; z-index: 1; margin-top: 2.5rem; }
	.go-cover-host { margin-top: auto; margin-bottom: 4rem; }
	.go-cover-kicker,
	.go-section-kicker { margin: 0 0 0.8rem; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
	.go-cover-kicker { color: rgba(255, 255, 255, 0.8); }

	.go-cover h1 {
		display: flex;
		align-items: center;
		flex-direction: column;
		margin: 0;
		font-family: 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive;
		font-size: clamp(4.5rem, 12vw, 9.5rem);
		font-weight: 500;
		letter-spacing: -0.08em;
		line-height: 0.65;
		text-shadow: 0 0.15rem 0 rgba(0, 79, 57, 0.18);
		transform: rotate(-5deg);
	}

	.go-cover h1 span:first-child { margin-right: 0.55em; }
	.go-cover h1 span + span { margin-left: 0.3em; }

	.go-new-office {
		display: inline-block;
		margin-top: 1.7rem;
		padding: 0.35rem 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.8);
		border-radius: 999px;
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.24em;
	}

	.go-cover-tagline { position: relative; z-index: 1; margin: 2.75rem 0 0; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; }

	.go-cover-seal { position: relative; z-index: 1; width: 13rem; height: 13rem; margin: 4rem 0 3.5rem; }
	.go-seal-ring { position: absolute; inset: 0; border: 1px solid rgba(1, 82, 61, 0.65); border-radius: 50%; background: rgba(0, 98, 71, 0.18); box-shadow: inset 0 0 0 0.35rem rgba(255, 255, 255, 0.06), 0 0.7rem 1.5rem rgba(0, 61, 43, 0.24); }
	.go-seal-ring-outer { transform: rotate(18deg) scale(1.02, 0.96); }
	.go-seal-ring-inner { inset: 0.8rem; border-color: rgba(255, 255, 255, 0.25); transform: rotate(-22deg) scale(0.96, 1.03); }
	.go-seal-core { display: grid; position: absolute; inset: 2.2rem; place-items: center; border: 0.3rem solid rgba(0, 60, 43, 0.55); border-radius: 38% 44% 42% 48%; background: linear-gradient(145deg, #e4ba4d, #a67920); box-shadow: inset 0 0 0 0.28rem #46795b, 0 0.3rem 0.5rem rgba(0, 51, 35, 0.35); color: #15513d; font-weight: 900; transform: rotate(-8deg); }
	.go-seal-core::before { position: absolute; inset: 0.8rem; border: 1px solid rgba(21, 81, 61, 0.65); border-radius: 0.25rem; content: ''; }
	.go-seal-core span { font-size: 1.8rem; letter-spacing: -0.12em; }
	.go-seal-core b { position: absolute; right: 1.4rem; bottom: 1.15rem; font-size: 1.4rem; }

	.go-cover-host { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 0.3rem; }
	.go-cover-host strong { font-family: 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive; font-size: clamp(2rem, 5vw, 3.8rem); font-weight: 500; line-height: 0.9; }
	.go-cover-host span { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.03em; }
	.go-scroll-cue { display: flex; position: absolute; right: 1.5rem; bottom: 1.5rem; left: 1.5rem; align-items: center; flex-direction: column; gap: 0.4rem; opacity: 0.75; }
	.go-scroll-cue span { display: block; width: 1.1rem; height: 1.7rem; border: 1px solid white; border-radius: 999px; }
	.go-scroll-cue small { font-size: 0.52rem; }

	.go-invitation { background: var(--go-white); text-align: center; }
	.go-script-title { color: var(--go-green); font-family: 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive; font-size: clamp(3.5rem, 8vw, 6.5rem); line-height: 0.8; }
	.go-invitation-lead { margin: 2rem 0 0.45rem; font-size: 0.82rem; font-weight: 800; }
	.go-invitation-copy { max-width: 32rem; margin: 0 auto 2.5rem; color: #263f37; font-size: 0.77rem; line-height: 1.65; }
	.go-building-photo { position: relative; width: 100%; max-width: 50rem; aspect-ratio: 1.72; margin: 0 auto; overflow: hidden; background: #dfece6; }
	.go-building-photo img, .go-interior-photo img, .go-office-photo img, .go-video-card img, .go-map-card img { display: block; width: 100%; height: 100%; object-fit: cover; }
	.go-building-placeholder { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(180deg, #d4eee8 0 48%, #b8d0bd 48% 54%, #739c73 54%); }
	.go-building-sky::before, .go-building-sky::after { position: absolute; top: 16%; width: 8rem; height: 3rem; border-radius: 50%; background: rgba(255,255,255,0.75); content: ''; filter: blur(0.5rem); }
	.go-building-sky::before { left: 10%; }.go-building-sky::after { right: 12%; }
	.go-building-shape { position: absolute; right: 13%; bottom: 13%; left: 13%; height: 48%; border: 0.25rem solid #6f533e; background: repeating-linear-gradient(90deg, #b79267 0 4%, #e5d3af 4% 6%, #876447 6% 10%); box-shadow: 0 0 0 0.5rem rgba(72, 89, 61, 0.25); transform: perspective(9rem) rotateX(5deg); }
	.go-building-shape::before { position: absolute; top: -28%; right: 8%; left: -3%; height: 27%; border: 0.2rem solid #5d4836; background: #8b6b4b; content: ''; transform: skewX(-25deg); }
	.go-building-shape i { display: block; position: absolute; top: 10%; bottom: 10%; width: 0.35rem; background: #4a7d72; }.go-building-shape i:nth-child(1){left:16%}.go-building-shape i:nth-child(2){left:33%}.go-building-shape i:nth-child(3){left:50%}.go-building-shape i:nth-child(4){left:67%}.go-building-shape i:nth-child(5){left:84%}.go-building-shape i:nth-child(6){bottom:-30%;left:48%;top:auto;width:18%;height:30%;background:#556d5b}
	.go-building-ground { position: absolute; right: 0; bottom: 0; left: 0; height: 14%; background: repeating-linear-gradient(110deg, #6d9568 0 0.4rem, #567f5b 0.4rem 0.7rem); }
	.go-photo-caption { max-width: 24rem; margin: 1.5rem auto 3rem; font-size: 0.7rem; line-height: 1.5; }
	.go-journey { max-width: 35rem; margin: 0 auto 2rem; }
	.go-section-kicker { color: var(--go-green); }
	.go-journey h2, .go-chapter h2, .go-details h2, .go-rsvp-intro h2 { margin: 0; color: var(--go-green); font-size: clamp(1.7rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.06em; line-height: 0.98; }
	.go-journey p:not(.go-section-kicker), .go-chapter-content > p:not(.go-section-kicker), .go-rsvp-intro > p:not(.go-section-kicker) { margin: 1rem auto; max-width: 32rem; color: #305046; font-size: 0.76rem; line-height: 1.65; }
	.go-story-line { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem; color: var(--go-green); font-size: 0.62rem; font-weight: 800; text-transform: uppercase; }
	.go-story-line span { display: block; width: 1.8rem; height: 1px; background: var(--go-green); }

	.go-video-card { display: flex; position: relative; align-items: center; justify-content: center; width: 100%; max-width: 38rem; aspect-ratio: 1.72; margin: 0 auto; overflow: hidden; border: 0.45rem solid var(--go-green); border-radius: 0.8rem; background: #087f5b; color: white; text-decoration: none; }
	.go-video-card img { opacity: 0.84; }
	.go-video-wash { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0, 111, 82, 0.58), rgba(13, 166, 120, 0.12)); }
	.go-video-placeholder { background: linear-gradient(135deg, #0b8866, #006b51); }
	.go-video-placeholder::before, .go-video-placeholder::after { position: absolute; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; content: ''; }.go-video-placeholder::before{inset:10% 8%;transform:rotate(18deg)}.go-video-placeholder::after{inset:22% 18%;transform:rotate(-20deg)}
	.go-play-button { display: grid; position: absolute; z-index: 1; width: 4rem; height: 4rem; place-items: center; padding-left: 0.2rem; border: 2px solid white; border-radius: 50%; background: rgba(255,255,255,0.16); font-size: 1.2rem; }
	.go-video-caption { position: absolute; right: 1rem; bottom: 0.7rem; left: 1rem; z-index: 1; font-size: 0.62rem; font-weight: 700; text-align: center; }

	.go-chapter { padding-top: 0; background: var(--go-green); text-align: center; }
	.go-interior-photo { position: relative; width: calc(100% + 2 * clamp(1.25rem, 8vw, 7rem)); height: clamp(14rem, 34vw, 25rem); margin: 0 calc(clamp(1.25rem, 8vw, 7rem) * -1); overflow: hidden; }
	.go-interior-photo::after { position: absolute; right: 0; bottom: 0; left: 0; height: 45%; background: linear-gradient(transparent, var(--go-green)); content: ''; }
	.go-interior-placeholder { position: absolute; inset: 0; background: linear-gradient(180deg, #cfe6dd 0 50%, #dbeee5 50% 100%); }
	.go-window { position: absolute; inset: 12% 20% 28%; border: 0.5rem solid #d6e6df; background: linear-gradient(120deg, rgba(255,255,255,0.85), rgba(127, 190, 176, 0.45)); box-shadow: inset 0 0 0 1px #7cb2a5; }
	.go-desk { position: absolute; bottom: 24%; width: 34%; height: 17%; border: 0.3rem solid #82644d; background: #d1a276; box-shadow: 0 0.7rem 0.7rem rgba(0,0,0,0.12); }.go-desk-one{left:13%}.go-desk-two{right:13%}
	.go-chair { position: absolute; bottom: 13%; width: 7%; height: 15%; border-radius: 35% 35% 20% 20%; background: #163b40; }.go-chair-one{left:27%}.go-chair-two{right:27%}
	.go-chapter-content { position: relative; z-index: 1; max-width: 39rem; margin: -1rem auto 0; }
	.go-value-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.7rem; max-width: 34rem; margin: 2rem auto 0; }
	.go-value-card { display: flex; min-height: 5.3rem; align-items: center; justify-content: center; flex-direction: column; gap: 0.45rem; padding: 0.7rem; border-radius: 0.65rem; background: rgba(255,255,255,0.86); color: var(--go-green); font-size: 0.6rem; font-weight: 800; line-height: 1.2; }
	.go-value-icon { display: grid; width: 2.1rem; height: 2.1rem; place-items: center; border: 2px solid currentColor; border-radius: 0.55rem; font-size: 1.2rem; }

	.go-details { background: var(--go-green); text-align: center; }
	.go-chapter h2, .go-chapter-content > p:not(.go-section-kicker), .go-chapter .go-section-kicker, .go-details h2, .go-details .go-section-kicker, .go-details .go-detail-row b, .go-details .go-detail-row small { color: white; }
	.go-details .go-detail-icon { color: var(--go-green); border-color: white; background: white; }
	.go-details .go-section-kicker { margin-bottom: 0.35rem; }
	.go-detail-list { display: grid; gap: 1rem; max-width: 25rem; margin: 2rem auto; text-align: left; }
	.go-detail-row { display: flex; align-items: center; gap: 0.9rem; }.go-detail-row > span:last-child { display: flex; flex-direction: column; gap: 0.2rem; }.go-detail-row b { color: var(--go-green); font-size: 0.78rem; }.go-detail-row small { color: #486b5d; font-size: 0.65rem; line-height: 1.35; }
	.go-detail-icon { display: grid; width: 2.5rem; height: 2.5rem; flex: 0 0 auto; place-items: center; border: 2px solid var(--go-green); border-radius: 0.6rem; color: var(--go-green); font-size: 1.2rem; font-weight: 900; }
	.go-map-card { display: block; position: relative; width: 100%; max-width: 32rem; aspect-ratio: 1.7; margin: 1.5rem auto; overflow: hidden; border: 0.35rem solid white; border-radius: 0.7rem; background: #dbeee4; box-shadow: 0 0.5rem 1rem rgba(0, 87, 64, 0.14); text-decoration: none; }
	.go-map-card img { object-fit: cover; }.go-map-placeholder { position: absolute; inset: 0; overflow: hidden; background: #d8eadf; }.go-map-grid { position: absolute; inset: -20%; opacity: 0.55; background: repeating-linear-gradient(20deg, transparent 0 1.5rem, #a9cabb 1.55rem 1.7rem), repeating-linear-gradient(110deg, transparent 0 2.1rem, #b2d1c0 2.15rem 2.3rem); transform: rotate(-8deg); }.go-map-placeholder i { position: absolute; top: 34%; left: 48%; width: 1.8rem; height: 1.8rem; border: 0.45rem solid white; border-radius: 50% 50% 50% 0; background: #e2554b; box-shadow: 0 0.25rem 0.4rem rgba(0,0,0,0.2); transform: rotate(-45deg); }.go-map-placeholder b { position: absolute; top: 45%; left: 50%; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: white; transform: translate(-50%, -50%); }.go-map-placeholder em { position: absolute; right: 0.6rem; bottom: 0.5rem; left: 0.6rem; color: var(--go-green); font-size: 0.55rem; font-style: normal; font-weight: 800; letter-spacing: 0.12em; }
	.go-map-link { display: inline-flex; position: absolute; right: 0.7rem; bottom: 0.6rem; left: 0.7rem; z-index: 2; align-items: center; justify-content: center; padding: 0.4rem; border-radius: 999px; background: var(--go-green); color: white; font-size: 0.58rem; font-weight: 800; }
	.go-office-photo { width: 100%; max-width: 41rem; aspect-ratio: 1.75; margin: 2rem auto -6rem; overflow: hidden; background: #d9e8df; }.go-office-placeholder { width: 100%; height: 100%; background: linear-gradient(180deg, #d9eee6 0 46%, #8ba98b 46% 58%, #73583f 58% 61%, #cad4bd 61%); }.go-office-placeholder::before { display: block; width: 64%; height: 62%; margin: 19% auto 0; border: 0.3rem solid #6f5139; background: repeating-linear-gradient(90deg, #d2af7e 0 8%, #577e70 8% 10%, #ebd9b2 10% 18%); content: ''; box-shadow: 0 0 0 0.4rem rgba(255,255,255,0.3); }

	.go-rsvp-intro { padding-top: 9rem; background: var(--go-white); text-align: center; }.go-rsvp-intro h2 em { font-family: 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive; font-size: 1.1em; font-weight: 500; }.go-rsvp-intro > p:not(.go-section-kicker) { max-width: 25rem; }.go-rsvp-link { display: inline-flex; align-items: center; gap: 0.6rem; margin-top: 1rem; padding: 0.55rem 1.1rem; border-radius: 999px; background: var(--go-green); color: white; font-size: 0.65rem; font-weight: 800; text-decoration: none; }.go-rsvp-link span { font-size: 1rem; }

	.go-footer { display: flex; align-items: center; flex-direction: column; gap: 1rem; padding-top: 3rem; padding-bottom: 3rem; background: linear-gradient(180deg, var(--go-white), var(--go-light)); text-align: center; }.go-footer-logo { color: var(--go-green); }.go-see-you { color: var(--go-green); font-family: 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive; font-size: clamp(3.2rem, 7vw, 5.8rem); line-height: 0.7; }.go-see-you small { display: block; margin-top: 0.7rem; color: #355c4e; font-family: var(--go-font), sans-serif; font-size: 0.64rem; font-weight: 700; letter-spacing: 0.05em; }.go-footer > p { max-width: 20rem; margin: 0; color: #547267; font-size: 0.68rem; line-height: 1.5; }.go-socials { display: flex; align-items: center; gap: 1rem; }.go-socials a { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--go-green); border-radius: 50%; color: var(--go-green); font-size: 0.8rem; text-decoration: none; }.go-website { color: #547267; font-size: 0.58rem; }

	.go-cover h1, .go-cover-host strong, .go-script-title, .go-rsvp-intro h2 em, .go-see-you { font-family: 'Grand Opening Script', cursive; }
	.go-footer-photo { position: relative; width: 100%; height: 12rem; margin-top: 1rem; overflow: hidden; }
	.go-footer-photo img { width: 100%; height: 100%; object-fit: cover; }
	.go-footer-photo::after { position: absolute; inset: 0; background: linear-gradient(var(--go-light), transparent 45%); content: ''; pointer-events: none; }
	@media (max-width: 600px) {
		.grand-opening-invite { border-radius: 0.8rem; }
		.go-cover { min-height: 39rem; }
		.go-cover-seal { width: 10rem; height: 10rem; margin-top: 3rem; margin-bottom: 3rem; }.go-seal-core { inset: 1.7rem; }.go-seal-core span { font-size: 1.4rem; }.go-seal-core b { right: 0.9rem; bottom: 0.8rem; }
		.go-value-grid { gap: 0.5rem; }.go-value-card { min-height: 5.1rem; padding: 0.5rem; font-size: 0.56rem; }
	}

	@media (prefers-reduced-motion: reduce) { .go-rsvp-link { transition: none; } }
</style>
