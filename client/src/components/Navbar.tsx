import { NavLink } from 'react-router-dom'

function Navbar(){
    const linkClassName = ({ isActive }: {isActive: boolean }) =>
            `nav-link${isActive ? ' nav-link--active': ''}`
    
    return(
        <div>
            <nav className="navbar">
                <span className={"navbar-logo status-pill"}>Project Tracker</span>
                <div className="navbar__links">
                    <NavLink to="/" className={linkClassName}>Dashboard</NavLink>
                    <NavLink to="/projects" className={linkClassName}>Projects</NavLink>
                    <NavLink to="/tasks" className={linkClassName}>Tasks</NavLink>
                </div>
                <button className="app-button navbar__logout">Logout</button>
            </nav>
        </div>
    )
}

export default Navbar