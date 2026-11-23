import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, BedDouble, Building2, MapPin, Menu, Search, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { getPublicListings, type PropertyListing } from '../shared/maps/listingsApi.js';
import './landingPage.css';

const categories = [
  { name: 'Houses', type: 'House', icon: Building2, note: 'Room to settle in' },
  { name: 'Condos', type: 'Condo', icon: Sparkles, note: 'A place in the city' },
  { name: 'Townhouses', type: 'Townhouse', icon: Building2, note: 'A little more space' },
  { name: 'Lots', type: 'Lot', icon: MapPin, note: 'Start with a blank canvas' },
];

const money = (amount: number) => `₱${Number(amount).toLocaleString('en-PH')}`;

function ScrollFade({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: reduceMotion ? 1 : 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.14 }} transition={{ duration: reduceMotion ? 0 : .55, delay: reduceMotion ? 0 : delay, ease: 'easeOut' }}>{children}</motion.div>;
}

export default function LandingPage() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 28);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  useEffect(() => {
    let current = true;
    getPublicListings().then((items) => { if (current) setListings(items.slice(0, 3)); })
      .catch(() => { if (current) setLoadError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const searchHref = (type?: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (type) params.set('type', type);
    return `/visitor${params.size ? `?${params}` : ''}`;
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.assign(searchHref());
  };

  return (
    <main className="landing">
      <header className={`landing-nav${scrolled ? ' is-scrolled' : ''}`}>
        <Link className="landing-brand" to="/" aria-label="Homelane home">
          <img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" />
          <span>homelane</span>
        </Link>
        <nav className={`landing-nav__links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a href="#explore" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <Link to="/agent" onClick={() => setMenuOpen(false)}>For agents</Link>
          <Link className="landing-nav__mobile-cta" to="/visitor">Browse homes</Link>
        </nav>
        <div className="landing-nav__actions">
          <Link className="landing-nav__sign-in" to="/auth/login">Sign in</Link>
          <Link className="landing-nav__browse" to="/visitor">Browse homes</Link>
        </div>
        <button className="landing-nav__menu" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <span className="landing-eyebrow"><span /> FIND A PLACE THAT FEELS LIKE YOURS</span>
          <h1>Make room for<br /><em>what’s next.</em></h1>
          <p>Explore homes and properties across the Philippines, and find the one that fits the life you’re building.</p>
          <form className="landing-search" onSubmit={submitSearch} role="search">
            <MapPin size={21} aria-hidden="true" />
            <label className="sr-only" htmlFor="landing-location">Location, neighborhood, or property</label>
            <input id="landing-location" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Where would you like to live?" />
            <button type="submit" aria-label="Search properties"><Search size={20} /><span>Search</span></button>
          </form>
        </div>
        <div className="landing-hero__visual" aria-label="Find a home that fits your next chapter">
          <div className="landing-hero__photo" role="img" aria-label="Sunlit contemporary home with a garden" />
          <div className="landing-hero__shape" />
          <div className="landing-hero__note"><span className="landing-hero__note-icon"><MapPin size={18} /></span><span><strong>Your next place</strong><small>Starts with a good search</small></span></div>
          <div className="landing-hero__stamp">A place<br />to call home</div>
        </div>
        <div className="landing-hero__bottom"><span>HOMES FOR EVERY CHAPTER</span><span>01 / EXPLORE</span></div>
      </section>

      <section className="landing-categories" id="explore">
        <ScrollFade className="landing-section-heading">
          <div><span className="landing-kicker">START WITH WHAT YOU NEED</span><h2>Find your kind of place.</h2></div>
          <Link className="landing-text-link" to="/visitor">See all properties <ArrowUpRight size={17} /></Link>
        </ScrollFade>
        <div className="landing-category-grid">
          {categories.map(({ name, type, icon: Icon, note }, index) => (
            <ScrollFade className="landing-category-reveal" key={type} delay={index * .07}>
              <Link className={`landing-category landing-category--${index + 1}`} to={searchHref(type)}>
                <span className="landing-category__icon"><Icon size={22} strokeWidth={1.7} /></span>
                <span className="landing-category__copy"><strong>{name}</strong><small>{note}</small><span className="landing-category__browse">Explore {name.toLowerCase()} <ArrowUpRight size={14} /></span></span>
                <span className="landing-category__arrow"><ArrowUpRight size={17} /></span>
              </Link>
            </ScrollFade>
          ))}
        </div>
      </section>

      <section className="landing-featured">
        <ScrollFade className="landing-section-heading">
          <div><span className="landing-kicker">A FEW PLACES TO GET YOU STARTED</span><h2>Made for your next move.</h2></div>
          <Link className="landing-text-link" to="/visitor/map">Explore the map <ArrowUpRight size={17} /></Link>
        </ScrollFade>
        {loading ? <ScrollFade><div className="landing-listing-state landing-listing-state--loading" role="status"><span className="landing-loading-mark" /><span>Finding published homes</span></div></ScrollFade> : listings.length ? (
          <div className="landing-listing-grid">
            {listings.map((listing, index) => (
              <ScrollFade className="landing-listing-reveal" key={listing.id} delay={index * .08}>
              <Link className="landing-listing" to={`/visitor/map?selected=${encodeURIComponent(listing.id)}`}>
                <div className={`landing-listing__image landing-listing__image--${index + 1}`}>
                  {listing.photos[0] && <img src={listing.photos[0]} alt={listing.title} loading="lazy" />}
                  <span className="landing-listing__type">{listing.propertyType}</span>
                  <span className="landing-listing__open"><ArrowUpRight size={19} /></span>
                </div>
                <div className="landing-listing__info"><span className="landing-listing__location"><MapPin size={14} />{listing.location}</span><h3>{listing.title}</h3><div className="landing-listing__footer"><strong>{money(listing.price)}</strong><span>{listing.bedrooms ? <><BedDouble size={15} /> {listing.bedrooms} beds</> : 'View details'}</span></div></div>
              </Link>
              </ScrollFade>
            ))}
          </div>
        ) : <ScrollFade><div className={`landing-featured-empty${loadError ? ' has-error' : ''}`}>
          <div className="landing-featured-empty__copy"><span className="landing-featured-empty__eyebrow">{loadError ? 'LISTINGS UNAVAILABLE' : 'A LITTLE ROOM TO EXPLORE'}</span><h3>{loadError ? 'We couldn’t load the homes just now.' : 'No featured homes just yet.'}</h3><p>{loadError ? 'You can still browse the public map while we reconnect.' : 'Browse every published property or explore the map to find a place that fits.'}</p><div className="landing-featured-empty__actions"><Link className="landing-button" to="/visitor">Browse homes <ArrowUpRight size={16} /></Link><Link className="landing-featured-empty__map-link" to="/visitor/map">Explore the map <ArrowUpRight size={16} /></Link></div></div>
          <div className="landing-featured-empty__visual" aria-hidden="true"><span className="landing-featured-empty__orbit landing-featured-empty__orbit--one" /><span className="landing-featured-empty__orbit landing-featured-empty__orbit--two" /><span className="landing-featured-empty__pin"><MapPin size={26} /></span><span className="landing-featured-empty__visual-label">HOMES ACROSS THE PHILIPPINES</span></div>
        </div></ScrollFade>}
      </section>

      <section className="landing-guide" id="how-it-works">
        <ScrollFade className="landing-guide__visual"><div className="landing-guide__photo" role="img" aria-label="A welcoming home interior" /><div className="landing-guide__caption"><span>TAKE YOUR TIME</span><strong>The right place<br />is worth finding.</strong></div></ScrollFade>
        <ScrollFade className="landing-guide__copy" delay={.1}><span className="landing-kicker">A CLEARER WAY TO LOOK</span><h2>From first search<br />to front door.</h2><p>Start broad, narrow down what matters, and explore each listing on the map. When you’re ready, sign in to message an agent or request a viewing.</p>
          <ol className="landing-steps"><li><span>01</span><div><strong>Explore the listings</strong><p>Search by location and browse published homes.</p></div></li><li><span>02</span><div><strong>See the neighborhood</strong><p>Use the map and distance filters to get your bearings.</p></div></li><li><span>03</span><div><strong>Make your next move</strong><p>Sign in to connect with an agent about a property.</p></div></li></ol>
          <Link className="landing-button" to="/visitor">Start exploring <ArrowUpRight size={17} /></Link>
        </ScrollFade>
      </section>

      <ScrollFade className="landing-cta"><div><span className="landing-kicker">YOUR NEXT CHAPTER STARTS SOMEWHERE</span><h2>Let’s find that somewhere.</h2></div><Link className="landing-button landing-button--light" to="/visitor">Explore properties <ArrowUpRight size={18} /></Link></ScrollFade>
      <footer className="landing-footer"><Link className="landing-brand" to="/"><img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" /><span>homelane</span></Link><span>Find a place that feels like yours.</span><div><Link to="/visitor">Explore homes</Link><Link to="/agent">Agent workspace</Link><Link to="/admin">Admin</Link></div><small>© {new Date().getFullYear()} Homelane</small></footer>
    </main>
  );
}
