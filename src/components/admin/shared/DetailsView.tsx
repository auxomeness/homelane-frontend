import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { Agents, listData } from "../libs/listData";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";

import './sharedStyles.css';



export function AdminAgentDetails() {
    const { agentId } = useParams<{ agentId: string }>();
    const agent = Agents.find((item) => item.id === agentId);
    const submitted = agent?.submission.toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const initials = agent?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

    return (
        <main className="agent-details-container admin-layout">
            <AdminHeader/>
            <AdminNavigation/>

            <div className="admin-page-content agent-details-body">
                <Link className="details-back" to="/admin/agent-reviews">
                    <ArrowLeft size={16} />
                    <span>Back to agent reviews</span>
                </Link>

                <header className="agent-details-header">
                    <h1>Agent details</h1>
                    <p>Review the agent&apos;s profile and credentials before recording a decision.</p>
                </header>

                {!agent ? <p className="agent-details-empty" role="status">Agent not found.</p> : <>
                    <section className="agent-content" >
                        <div className="agent-summary-identity">
                            <div className="agent-profile">
                                {agent.image ? <img src={agent.image} alt="" /> : initials}
                            </div>
                            <div className="agent-name">
                                <h2>{agent.name}</h2>
                                <p>{agent.location} · Submitted {submitted}</p>
                            </div>
                        </div>
                        <div className="agent-status">
                            <span className={'agent-status-pill agent-status-pill--' + agent.status}>
                                {agent.status === 'cancelled' ? 'Rejected' : agent.status}
                            </span>
                        </div>
                    </section>

                    <div className="agent-details-grid">
                        <div className="agent-details-main">
                            <section className="agent-details-card">
                                <h2 id="agent-profile-heading">Profile</h2>
                                <dl className="agent-details-fields">
                                    <div><dt>Email</dt><dd>{agent.email}</dd></div>
                                    <div><dt>Mobile number</dt><dd>{agent.mobileNumber}</dd></div>
                                    <div><dt>City</dt><dd>{agent.location}</dd></div>
                                </dl>
                            </section>

                            <section className="agent-details-card">
                                <h2 id="agent-credentials-heading">Credentials</h2>
                                <dl className="agent-details-fields">
                                    <div><dt>License reference</dt><dd>{agent.title || 'Not provided'}</dd></div>
                                    <div><dt>Document expiry</dt><dd>Not provided</dd></div>
                                </dl>
                                <button type="button" className="agent-certificate-button" disabled>View Certificate</button>
                            </section>
                        </div>

                        <div className="agent-details-side">
                            <section className="agent-details-card">
                                <h2 id="agent-feedback-heading">Feedback</h2>
                                <label htmlFor="agent-feedback">Concerns or feedback for the agent</label>
                                <textarea id="agent-feedback" placeholder="Description" disabled />
                            </section>

                            <section className="agent-details-card">
                                <h2 id="agent-decision-heading">Record decision</h2>
                                <p>Review the profile and certificate before approving or rejecting this application.</p>
                                <div className="agent-decision-actions">
                                    <button type="button" className="agent-decision-reject" disabled>Reject</button>
                                    <button type="button" className="agent-decision-approve" disabled>✓ Approve</button>
                                </div>
                            </section>
                        </div>
                    </div>
                </>}
            </div>
        </main>
    );
}

export function AdminListingDetails() {

    const { listId } = useParams <{listId: string}>();
    
    const list = listData.find(
        (list) => listId === list.id
    )

    return(
        <main className="listing-details-container">

            <Link to={"/admin/listing-reviews"}>
            <div className="back">
                <ArrowLeft/>
                <p>Back to listing reviews</p>
            </div>

        {!list ? <h1>List not found</h1> :
            <>
            <header className="list-details-header">
                <h2>Listing details</h2>
                <span>Review the property facts, assigned agent, and submitted location </span>
            </header>

            <section className="list-content">
                <div className="list-profile">
                    {list.image}
                </div>

                <div className="list-name">
                <h3>{list.title}</h3>
                <span>{list.location}</span> | 
                </div>

            </section>
            </>
            }

            </Link>
        </main>
    );
}
