import { Link } from 'react-router-dom'

export const Header = ({ onClickHeader }: { onClickHeader?: () => void }) => {
  return (
    <header>
      <div>
        <h2>
          <a href={'https://' + window.location.host}>Real-Time File Transfer</a>
        </h2>
        {onClickHeader && (
          <span>
            <Link to="/host" onClick={() => onClickHeader()}>
              はじめる
            </Link>
          </span>
        )}
      </div>
    </header>
  )
}
