import React from 'react';
import { formatDateJP, getFriday } from '../utils/dateUtils';
import { format } from 'date-fns';

const ReportHeader = ({ reporterName, setReporterName, startDate, setStartDate }) => {
    const dateInputRef = React.useRef(null);

    const handleDateChange = (e) => {
        if (e.target.value) {
            setStartDate(new Date(e.target.value));
        }
    };

    const triggerPicker = () => {
        if (dateInputRef.current) {
            if (dateInputRef.current.showPicker) {
                dateInputRef.current.showPicker();
            } else {
                dateInputRef.current.click();
            }
        }
    };

    const endDate = startDate ? getFriday(startDate) : null;

    return (
        <div className="report-header-grid">
            <div className="header-row">
                <div className="header-label bg-orange">報告者</div>
                <div className="header-input-container">
                    <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="report-input full-width"
                        placeholder="氏名を入力"
                    />
                </div>
            </div>
            <div className="header-row">
                <div className="header-label bg-orange">開始日</div>
                <div className="header-input-container half">
                    <div className="date-input-wrapper" onClick={triggerPicker} style={{ cursor: 'pointer' }}>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                            onChange={handleDateChange}
                            className="report-date-input"
                        />
                        <div className="date-pill-display">
                            {startDate ? formatDateJP(startDate) : ''}
                            <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>📅</span>
                        </div>
                    </div>
                </div>
                <div className="header-label bg-orange">終了日</div>
                <div className="header-input-container half">
                    <div className="date-pill-display no-hover">
                        {endDate ? formatDateJP(endDate) : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportHeader;
