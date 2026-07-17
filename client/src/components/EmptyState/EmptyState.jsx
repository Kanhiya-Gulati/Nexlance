import { Link } from 'react-router-dom';
import './EmptyState.css';

/**
 * EmptyState - Displayed when there's no data to show.
 * @param {string} icon - Emoji or icon character
 * @param {string} title - Heading text
 * @param {string} message - Sub-text description
 * @param {string} [actionText] - CTA button label
 * @param {string} [actionLink] - CTA button href
 */
const EmptyState = ({ icon, title, message, actionText, actionLink }) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {actionText && actionLink && (
        <Link to={actionLink} className="empty-state__action">
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
