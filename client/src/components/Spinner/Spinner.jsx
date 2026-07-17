import './Spinner.css';

/**
 * Spinner - Loading indicator component
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} color - optional override color
 */
const Spinner = ({ size = 'md', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className={`spinner spinner--${size}`} aria-label="Loading..." role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`spinner spinner--${size}`} aria-label="Loading..." role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
