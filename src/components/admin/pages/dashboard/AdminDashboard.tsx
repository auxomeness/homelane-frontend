import { ListCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import StatCard from '../../dashboard/StatCard';
import AdminHeader from '../../shared/AdminHeader'
import AdminNavigation from '../../shared/AdminNavigation';

import './dashboardPageStyles.css'

import AgentGrid from '../../dashboard/AgentGrid';
import ListGrid from '../../dashboard/ListGrid';
import { getAdminDashboard, type AdminDashboardData } from '../../../../shared/admin/dashboardApi.js';

import { Link, Outlet } from 'react-router';


export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        getAdminDashboard()
            .then((result) => { if (active) setDashboard(result); })
            .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load dashboard.'); });
        return () => { active = false; };
    }, []);
    return(
        <main className='admin-container admin-layout'>
            <AdminHeader/>
            <AdminNavigation/>

            <div className="admin-page-content">
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>An overview of agent applications and property listing reviews.</p>
                </div>

                <div className="admin-stat">
                    <StatCard label={'Pending agent reviews'} value={dashboard?.counts.pendingAgentApplications ?? (error ? '—' : '…')} href={'agent-reviews'} icon={User}/>
                    <StatCard label={'Pending listing reviews'} value={dashboard?.counts.pendingListings ?? (error ? '—' : '…')} href={'listing-reviews?status=pending'} icon={ListCheck}/>
                </div>

                {error && <p className="review-empty" role="alert">{error}</p>}
                <article id='admin-reviews-container'>
                    <section className='admin-reviews'>
                        <div>
                            <h2>Recent pending agent reviews</h2>

                            {!dashboard && !error && <p className="review-empty" role="status">Loading agent reviews…</p>}
                            {dashboard?.recent.agentApplications.map((agent) => (
                                <Link 
                                    key={agent.id}
                                    to={'/admin/agent-reviews/' + agent.id}
                                    className='card-list'>
                                <AgentGrid 
                                    image={ agent.fullName.slice(0, 1) }
                                    name={ agent.fullName }
                                    title={ agent.licenseNumber }
                                    location={ agent.city }
                                    status={ agent.status }/>
                                </Link>
                            ))}

                            {dashboard?.counts.pendingAgentApplications === 0 && <p className="review-empty">No agent reviews pending.</p>}

                        </div>
                    </section>

                    <section className='admin-reviews'>
                        <article>
                            <h2>Recent pending listing reviews</h2>


                            {!dashboard && !error && <p className="review-empty" role="status">Loading listing reviews…</p>}
                            {dashboard?.recent.listings.map((list) => (

                                <Link key={list.id} to={'/admin/listing-reviews/' + list.id} className='card-list'>
                                <ListGrid image={list.propertyType.slice(0, 1)} name={list.title} title={list.propertyType} location={list.location} status={list.status}/>
                                </Link>

                            ))}
                            
                            {dashboard?.counts.pendingListings === 0 && <p className="review-empty">No listing reviews pending.</p>}

                        </article>
                    </section>
                </article>

                <Outlet/>
            </div>
        </main>
    );
}
