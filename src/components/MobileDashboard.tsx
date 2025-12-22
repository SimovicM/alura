import React from 'react';
import { ShoppingCart, ChevronUp } from 'lucide-react';
import type { CartItem } from '../types';

interface MobileDashboardProps {
  items: CartItem[];
  onOpenCart: () => void;
  appliedCoupon?: { code: string; percent: number } | null;
  onApplyCoupon?: (code: string) => Promise<boolean>;
}

export default function MobileDashboard({ items, onOpenCart, appliedCoupon, onApplyCoupon }: MobileDashboardProps) {
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = appliedCoupon ? Math.round((appliedCoupon.percent / 100) * total * 100) / 100 : 0;
  const final = Math.round((total - discount) * 100) / 100;
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [msg, setMsg] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);

  return (
    <div className="md:hidden fixed left-4 right-4 bottom-4 z-50">
      <div className={`bg-surface/80 backdrop-blur rounded-xl p-3 shadow-lg border border-white/10 transition-all ${open ? 'translate-y-0' : 'translate-y-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm">Cart</div>
              <div className="text-xs text-gray-400">{items.length} item(s) • {final} €</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {appliedCoupon && <div className="text-xs text-primary px-2 py-1 bg-primary/10 rounded">{appliedCoupon.code} -{appliedCoupon.percent}%</div>}
            <button onClick={() => { setOpen(!open); }} className="p-2">
              <ChevronUp className={`w-4 h-4 transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon code" className="flex-1 px-3 py-2 bg-black/50 rounded border border-white/10" />
              <button className="px-3 py-2 bg-primary text-white rounded" onClick={async () => {
                if (!onApplyCoupon) return;
                setApplying(true);
                const ok = await onApplyCoupon(code.trim());
                setApplying(false);
                setMsg(ok ? 'Coupon applied' : 'Invalid code');
              }}>{applying ? '...' : 'Apply'}</button>
            </div>
            {msg && <div className="text-xs text-gray-300">{msg}</div>}
            <div className="flex gap-2">
              <button onClick={onOpenCart} className="flex-1 bg-primary text-white py-2 rounded">Open Cart</button>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3 py-2 border rounded">Top</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
