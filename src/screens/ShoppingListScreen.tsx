import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';

interface Props { ctx: AppStateContext; }

export default function ShoppingListScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, addShoppingItem, toggleShoppingItem, removeShoppingItem, clearCheckedShoppingItems } = ctx;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const items = [...state.shoppingItems].sort((a, b) => {
    if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const unchecked = items.filter(i => !i.isChecked);
  const checked = items.filter(i => i.isChecked);

  const handleAdd = () => {
    const n = name.trim();
    if (!n) return;
    addShoppingItem(n, quantity.trim() || undefined);
    setName('');
    setQuantity('');
    inputRef.current?.focus();
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.shopping')}</h1>
        {checked.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={clearCheckedShoppingItems}>
            {t('shopping.clearChecked')}
          </button>
        )}
      </div>

      {/* Quick add */}
      <div className="shopping-add-row">
        <input
          ref={inputRef}
          className="input shopping-name-input"
          placeholder={t('shopping.addPlaceholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <input
          className="input shopping-qty-input"
          placeholder={t('shopping.qty')}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!name.trim()}>
          +
        </button>
      </div>

      {/* Unchecked items */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'🛒'}</div>
          <p>{t('shopping.empty')}</p>
        </div>
      ) : (
        <div className="shopping-list">
          {unchecked.map(item => (
            <div key={item.id} className="shopping-item">
              <button
                className="task-checkbox"
                onClick={() => toggleShoppingItem(item.id)}
              />
              <span className="shopping-item-name">{item.name}</span>
              {item.quantity && (
                <span className="shopping-item-qty">{item.quantity}</span>
              )}
              <button
                className="btn btn-ghost btn-icon btn-sm shopping-item-remove"
                onClick={() => removeShoppingItem(item.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}

          {/* Checked items */}
          {checked.length > 0 && (
            <>
              <div className="shopping-divider">{t('shopping.checkedItems')} ({checked.length})</div>
              {checked.map(item => (
                <div key={item.id} className="shopping-item shopping-item--checked">
                  <button
                    className="task-checkbox checked"
                    onClick={() => toggleShoppingItem(item.id)}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </button>
                  <span className="shopping-item-name">{item.name}</span>
                  {item.quantity && (
                    <span className="shopping-item-qty">{item.quantity}</span>
                  )}
                  <button
                    className="btn btn-ghost btn-icon btn-sm shopping-item-remove"
                    onClick={() => removeShoppingItem(item.id)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
