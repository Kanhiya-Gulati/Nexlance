import { Link } from 'react-router-dom';
import './NotFound.css';

/**
 * NotFound - 404 page displayed for unmatched routes.
 */
const NotFound = () => {
  return (
    <div className="page-container notfound-page">
      <div className="notfound-container">
        <div className="notfound-graphic">
          <span className="notfound-code">404</span>
          <div className="notfound-shapes">
            <div className="nf-shape nf-shape-1" />
            <div className="nf-shape nf-shape-2" />
            <div className="nf-shape nf-shape-3" />
          </div>
        </div>

        <div className="notfound-content">
          <h1 className="notfound-title">Page Not Found</h1>
          <p className="notfound-message">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="notfound-actions">
            <Link to="/" className="notfound-btn notfound-btn--primary">
              ← Go Home
            </Link>
            <button
              className="notfound-btn notfound-btn--secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
