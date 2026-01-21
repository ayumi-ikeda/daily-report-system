import React, { useState, useEffect } from 'react';
import { formatDateJP, formatDateTimeJP } from '../utils/dateUtils';
import { format } from 'date-fns';
import pkg from '../../package.json';

const Dashboard = ({ onSelectReport, onCreateNew }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = () => {
        setLoading(true);
        fetch('http://localhost:3001/api/reports')
            .then(res => res.json())
            .then(data => {
                setReports(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch reports', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = (id, date) => {
        if (window.confirm(`${formatDateJP(new Date(date))} のレポートを削除してもよろしいですか？`)) {
            fetch(`http://localhost:3001/api/reports/${id}`, {
                method: 'DELETE',
            })
                .then(res => res.json())
                .then(() => {
                    fetchReports(); // Refresh the list
                })
                .catch(err => {
                    console.error('Failed to delete report', err);
                    alert('削除に失敗しました');
                });
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>業務日誌（週報）管理システム</h1>
                <button className="primary-button" onClick={onCreateNew}>
                    + 新規レポート作成
                </button>
            </div>

            <div className="reports-list-section">
                <h2>作成済みレポート一覧</h2>
                {loading ? (
                    <p>読み込み中...</p>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <p>まだレポートがありません。新規作成から始めてください。</p>
                    </div>
                ) : (
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>開始日</th>
                                <th>終了日（目安）</th>
                                <th>報告者</th>
                                <th>更新日時</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id}>
                                    <td>{formatDateJP(new Date(report.startDate))}</td>
                                    <td>{/* Simple calculation for end date display if needed */}
                                        {formatDateJP(new Date(new Date(report.startDate).getTime() + 4 * 24 * 60 * 60 * 1000))}
                                    </td>
                                    <td>{report.reporterName || '未入力'}</td>
                                    <td>{formatDateTimeJP(new Date(report.updatedAt))}</td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button className="secondary-button" onClick={() => onSelectReport(report.startDate)}>
                                            編集
                                        </button>
                                        <button
                                            className="secondary-button"
                                            style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                                            onClick={() => handleDelete(report.id, report.startDate)}
                                        >
                                            削除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="version-display">
                Version {pkg.version}
            </div>
        </div>
    );
};

export default Dashboard;
