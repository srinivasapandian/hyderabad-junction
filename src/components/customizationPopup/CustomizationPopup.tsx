import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CartLine } from '../../types';
import './CustomizationPopup.css';

interface Props {
  lines: CartLine[];
  onClose: () => void;
  onQtyChange: (lineId: string, delta: number) => void;
  onEdit: (line: CartLine) => void;
  onNewCustomization: () => void;
}

function groupModifiers(line: CartLine): Array<{ label: string; options: string[] }> {
  if (!line.modifiers?.length) return [];
  const map: Record<string, string[]> = {};
  const order: string[] = [];
  for (const m of line.modifiers) {
    const key = m.typeName || m.typeId || 'Add-ons';
    if (!map[key]) { map[key] = []; order.push(key); }
    map[key].push(m.optionName);
  }
  return order.map((k) => ({ label: k, options: map[k] }));
}

export default function CustomizationPopup({ lines, onClose, onQtyChange, onEdit, onNewCustomization }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="cpop-backdrop" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="cpop" onClick={(e) => e.stopPropagation()}>

        <div className="cpop__header">
          <h2 className="cpop__title">Customization</h2>
          <button className="cpop__close" onClick={onClose} type="button" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="cpop__lines">
          {lines.map((line) => {
            const groups = groupModifiers(line);
            return (
              <div key={line.lineId} className="cpop__line-card">
                {/* Row 1: item name ║ stepper */}
                <div className="cpop__line-row">
                  <p className="cpop__line-name">{line.itemName}</p>
                  <div className="cpop__stepper">
                    <button
                      className="cpop__step-btn"
                      type="button"
                      onClick={() => onQtyChange(line.lineId, -1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="cpop__step-val">
                      {String(line.qty).padStart(2, '0')}
                    </span>
                    <button
                      className="cpop__step-btn"
                      type="button"
                      onClick={() => onQtyChange(line.lineId, 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Row 2: modifier options ║ edit */}
                {groups.length > 0 && (
                  <div className="cpop__line-row">
                    <div className="cpop__line-mods-wrap">
                      {groups.map(({ label, options }) => (
                        <p key={label} className="cpop__line-mods">
                          {label}:{' '}
                          <strong className="cpop__line-mods-options">{options.join(', ')}</strong>
                        </p>
                      ))}
                    </div>
                    <button
                      className="cpop__edit-btn"
                      type="button"
                      onClick={() => onEdit(line)}
                    >
                      Edit <i className="fa-solid fa-circle-arrow-right" />
                    </button>
                  </div>
                )}

                {/* Edit-only row when no modifier groups */}
                {groups.length === 0 && (
                  <div className="cpop__line-row cpop__line-row--end">
                    <button
                      className="cpop__edit-btn"
                      type="button"
                      onClick={() => onEdit(line)}
                    >
                      Edit <i className="fa-solid fa-circle-arrow-right" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="cpop__add-new" type="button" onClick={onNewCustomization}>
          + Add New Customization
        </button>

      </div>
    </div>,
    document.body,
  );
}
