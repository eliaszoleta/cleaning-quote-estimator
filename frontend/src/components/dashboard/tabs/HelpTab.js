import React, { useState } from 'react';
import {
  HelpCircle, Calculator, SlidersHorizontal, MapPin, ToggleRight,
  Paintbrush, Code2, ChevronDown,
} from 'lucide-react';

const cardStyle = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const sectionTitle = { display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 };
const iconBadge = (bg) => ({ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 });
const pStyle = { fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: '0 0 10px' };

const FAQ = [
  {
    q: 'A price came out wrong — what should I check first?',
    a: 'Almost always the markup on that specific service, in the Services tab. Every price starts from Clean Estimator\'s own base pricing for that service and state, then gets multiplied by your markup (1.0 = unchanged, 1.2 = 20% higher, 0.8 = 20% lower). If a service looks off across the board, that\'s the number to adjust — not something to report as a bug.',
  },
  {
    q: 'Can I set different prices for different cities or states?',
    a: 'Not per-city. The state cost-of-living adjustment is already baked into the base price automatically (a home cleaning in California is priced higher than the same job in Alabama, before your markup even applies) — your markup is a single multiplier on top of that, the same everywhere you operate.',
  },
  {
    q: 'What happens if I disable a service?',
    a: 'It disappears from the "What service do you need?" screen on your embedded calculator entirely — visitors won\'t see it as an option at all, not even a grayed-out one.',
  },
  {
    q: 'What does the minimum charge field actually do?',
    a: 'It puts a floor under the calculated price for that service. If the formula would come out below your minimum for a very small job, the calculator shows your minimum instead. Leave it blank if you don\'t want a floor.',
  },
  {
    q: 'Why did my widget suddenly show "paused" to visitors?',
    a: 'Your 30-day free trial ended without subscribing, or a payment failed. Check the Subscription tab — reactivating takes one click and the widget comes back immediately, no visitor data is lost while paused.',
  },
  {
    q: 'Do I need to touch the base pricing formulas myself?',
    a: "No — you can't, and you don't need to. Clean Estimator maintains the underlying pricing data (by state, by service, by job size/condition/frequency) so it stays accurate over time. Your job is just markup, minimums, which services you offer, and your branding.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}
      >
        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', paddingRight: 12 }}>{q}</span>
        <ChevronDown size={16} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </button>
      {open && <p style={{ ...pStyle, marginTop: 10, marginBottom: 0 }}>{a}</p>}
    </div>
  );
}

export default function HelpTab() {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 3, letterSpacing: '-0.3px' }}>Help &amp; Documentation</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>How the calculator works, and how to make it price things the way you want.</p>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#eff6ff')}><Calculator size={16} color="#2563eb" /></div>
          How the calculator works, end to end
        </div>
        <p style={pStyle}>
          A visitor lands on your website, opens the embedded calculator, and picks a service (house cleaning, carpet cleaning, etc. — whichever you've enabled). They answer a few quick questions about the job — home size, number of bedrooms/bathrooms, condition, how often they want service — and their location.
        </p>
        <p style={pStyle}>
          Clean Estimator calculates a price range from that: a base rate for the service, adjusted for their state's typical cost of living, adjusted again for the specific details they entered, and finally multiplied by <strong>your</strong> markup. They see an instant price range, no phone call needed — and if they leave their email, you get notified with their contact info the moment it happens (check your inbox, or the Leads tab).
        </p>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#f5f3ff')}><SlidersHorizontal size={16} color="#7c3aed" /></div>
          Understanding your price: the three levers
        </div>
        <p style={pStyle}>
          Every price shown to a visitor is built from three things multiplied together. Only the third one is yours to control:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ ...iconBadge('#f8fafc'), width: 24, height: 24 }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>1</span></div>
            <p style={{ ...pStyle, margin: 0 }}><strong style={{ color: '#0f172a' }}>Base price</strong> — Clean Estimator's own pricing data for that service, driven by what the visitor actually entered (square footage, bedrooms, condition, frequency, add-ons). This is maintained centrally and kept accurate over time — you don't set or edit it.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ ...iconBadge('#f8fafc'), width: 24, height: 24 }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>2</span></div>
            <p style={{ ...pStyle, margin: 0 }}><strong style={{ color: '#0f172a' }}>State cost-of-living adjustment</strong> — applied automatically based on the visitor's state. Cleaning in a high cost-of-living state prices higher than the identical job in a lower cost-of-living one, before your markup even applies. Also not something you set — it's built in.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ ...iconBadge('#eff6ff'), width: 24, height: 24 }}><span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>3</span></div>
            <p style={{ ...pStyle, margin: 0 }}><strong style={{ color: '#0f172a' }}>Your markup</strong> — a multiplier you control per service, in the Services tab. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12.5 }}>1.0</code> shows the price exactly as calculated. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12.5 }}>1.2</code> shows it 20% higher. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12.5 }}>0.85</code> shows it 15% lower. This is the number to change if your prices don't match what you'd actually quote.</p>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#f0fdf4')}><ToggleRight size={16} color="#16a34a" /></div>
          Choosing what you offer (Services tab)
        </div>
        <p style={pStyle}>
          Each of the 9 services has its own on/off switch, markup, and minimum charge — set them independently. Turn off anything you don't actually do; visitors will never see it as an option. Set a <strong>minimum charge</strong> for a service if you don't want the calculator quoting a price below what's worth sending someone out for, regardless of how small the job details make the math come out.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#fff7ed')}><MapPin size={16} color="#ea580c" /></div>
          What actually moves the price, per job
        </div>
        <p style={pStyle}>Beyond your markup, the price a specific visitor sees depends on details only they control, entered right in the calculator:</p>
        <ul style={{ ...pStyle, margin: 0, paddingLeft: 20 }}>
          <li><strong>Size</strong> — square footage, bedrooms, bathrooms (house/apartment), or square footage alone (commercial, carpet, tile, air duct).</li>
          <li><strong>Condition</strong> — standard vs. deep-clean vs. move-in/move-out, or "how dirty is it" for carpet/tile/mold jobs.</li>
          <li><strong>Frequency</strong> — one-time jobs cost more per visit than recurring weekly/biweekly/monthly service, which gets a built-in recurring discount.</li>
          <li><strong>Add-ons</strong> — extras like inside-oven, inside-fridge, area rugs, extra stairs, etc., each with their own additional cost.</li>
          <li><strong>Location</strong> — their state, via the cost-of-living adjustment described above.</li>
        </ul>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#fdf4ff')}><Paintbrush size={16} color="#a21caf" /></div>
          Making it look like yours (Branding tab)
        </div>
        <p style={pStyle}>
          Your logo, brand colors, and the headline/subtext/button visitors see before they start — all live in the Branding tab. None of this affects pricing, only appearance and the call-to-action copy.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>
          <div style={iconBadge('#eff6ff')}><Code2 size={16} color="#2563eb" /></div>
          Putting it on your website (Embed Widget tab)
        </div>
        <p style={pStyle}>
          Copy the embed code from the Embed Widget tab into your site once — after that, every change you make here (markup, branding, enabled services) updates on your live site automatically, with nothing to re-paste.
        </p>
      </div>

      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={sectionTitle}>
          <div style={iconBadge('#fef2f2')}><HelpCircle size={16} color="#dc2626" /></div>
          Frequently asked questions
        </div>
        <div>
          {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
        </div>
        <p style={{ ...pStyle, marginTop: 14, marginBottom: 0, fontSize: 12.5, color: '#94a3b8' }}>
          Still stuck on something? Reply to any Clean Estimator email, or reach out from the Settings tab.
        </p>
      </div>
    </div>
  );
}
