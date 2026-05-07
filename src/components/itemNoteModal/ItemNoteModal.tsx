import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import itemNoteSvg from '../../assets/svg/item-note.svg';
import './ItemNoteModal.css';

interface ItemNoteModalProps {
  isOpen: boolean;
  initialValue?: string;
  itemName?: string;
  onClose: () => void;
  onSave: (comment: string) => void;
}

const MAX_LENGTH = 150;

function ItemNoteModal({
  isOpen,
  initialValue = '',
  itemName,
  onClose,
  onSave,
}: ItemNoteModalProps) {
  const [value, setValue] = useState<string>(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue('');
    onSave('');
    onClose();
  };

  if (typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="inm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="inm-modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Item note"
          >
            <div className="inm-head">
              <img src={itemNoteSvg} alt="" className="inm-head-icon" />
              <div className="inm-head-text">
                <h3 className="inm-title">Item Note</h3>
                {itemName && <p className="inm-sub">{itemName}</p>}
              </div>
            </div>

            <label className="inm-field">
              <span className="inm-label">Your note</span>
              <textarea
                ref={textareaRef}
                className="inm-textarea"
                placeholder="Add a special request for this item (e.g., less spicy, no onions)"
                maxLength={MAX_LENGTH}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={5}
              />
              <span className="inm-counter">
                {value.length}/{MAX_LENGTH}
              </span>
            </label>

            <div className="inm-actions">
              {initialValue ? (
                <button
                  type="button"
                  className="inm-btn inm-btn--ghost"
                  onClick={handleClear}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="inm-btn inm-btn--ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="inm-btn inm-btn--primary"
                onClick={handleSave}
                disabled={value.trim().length === 0 && !initialValue}
              >
                Save Note
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default ItemNoteModal;
