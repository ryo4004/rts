import { Link } from 'react-router-dom'
import { version } from '../../../Library/Library'

import Profile from '../../../Assets/profile-pic.jpg'

export const Footer = ({ author }: { author: boolean }) => {
  return (
    <footer>
      <div className="title">
        <h2>
          <Link to="/">Real-Time File Transfer</Link>
          <span className="version">{version}</span>
        </h2>
      </div>
      {author && (
        <div className="author">
          <img src={Profile} alt="profile" />
          <p>
            akanewz
            <a href="https://twitter.com/akanewz" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
          </p>
        </div>
      )}
    </footer>
  )
}
