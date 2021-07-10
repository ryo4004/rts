import './Tutorial.scss'

export const Tutorial = ({ isHost }: { isHost: boolean }) => {
  return (
    <div className="tutorial">
      <h3>使い方</h3>
      <ol>
        {isHost && (
          <>
            <li>共有URLをファイルを受け取る相手に通知します</li>
            <li>自動的に相手との間にP2P接続を試みます</li>
            <li>
              相手との間に接続が確立するとdataChannelマークが<i className="fas fa-check-circle"></i>になります
            </li>
            <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
          </>
        )}
        {!isHost && (
          <>
            <li>自動的に相手との間にP2P接続を試みます</li>
            <li>
              相手との間に接続が確立するとdataChannelマークが<i className="fas fa-check-circle"></i>になります
            </li>
            <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
          </>
        )}
      </ol>
    </div>
  )
}
