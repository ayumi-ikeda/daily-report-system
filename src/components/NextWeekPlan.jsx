import React from 'react';

const NextWeekPlan = ({ content, setContent }) => {
    return (
        <div className="next-week-wrapper">
            <div className="daily-section-title">次週（予定）</div>
            <div className="next-week-container">
                <textarea
                    className="entry-textarea" // Reusing same class for consistency
                    style={{ height: '100%', minHeight: '140px' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
        </div>
    );
};

export default NextWeekPlan;
