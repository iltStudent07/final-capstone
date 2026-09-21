import { Link } from 'react-router-dom'

function NotFound(){
    return (
        <div>
            <h1>404 Error</h1>
            <p>The page you are looking for is in another castle!</p>
            <button><Link to="/">Back to Dashboard</Link></button>
        </div>
    )
}

export default NotFound