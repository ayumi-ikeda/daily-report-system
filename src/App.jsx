import React, { useState, useEffect } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { getMonday, getWeekDays, formatDateJP } from './utils/dateUtils';
import ReportHeader from './components/ReportHeader';
import DailyEntry from './components/DailyEntry';
import NextWeekPlan from './components/NextWeekPlan';
import Dashboard from './components/Dashboard';
import './styles/index.css';


const API_BASE = 'http://localhost:3001/api';

const preserveSpaces = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/(<[^>]+>)\s+/g, (match, tag) => {
        return tag + '&nbsp;'.repeat(match.length - tag.length);
    }).replace(/  /g, ' &nbsp;');
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red', background: '#fee', margin: '20px', border: '1px solid red' }}>
                    <h2>エラーが発生しました</h2>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} style={{ marginTop: '10px', padding: '5px 10px' }}>
                        再読み込み
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    // Navigation State
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'editor'

    // Report State
    const [reportId, setReportId] = useState(null);
    const [reporterName, setReporterName] = useState('');
    const [startDate, setStartDate] = useState(getMonday(new Date()));
    const [entries, setEntries] = useState({});
    const [nextWeekPlan, setNextWeekPlan] = useState('');

    useEffect(() => {
        console.log('Current view:', view);
    }, [view]);

    // Fetch report data when editing
    const loadReport = (idOrDate) => {
        console.log('Loading report:', idOrDate);
        fetch(`${API_BASE}/reports/${idOrDate}`)
            .then(res => res.json())
            .then(data => {
                setReportId(data.id);
                setReporterName(data.reporterName || '');
                setStartDate(parseISO(data.startDate));
                
                const processedEntries = {};
                if (data.entries) {
                    for (const key in data.entries) {
                        processedEntries[key] = {
                            ...data.entries[key],
                            content: preserveSpaces(data.entries[key].content)
                        };
                    }
                }
                setEntries(processedEntries);
                setNextWeekPlan(preserveSpaces(data.nextWeekPlan || ''));
                setView('editor');
            })
            .catch(err => {
                console.error('Failed to load report', err);
                if (idOrDate.includes('-')) {
                    setStartDate(parseISO(idOrDate));
                    setEntries({});
                    setNextWeekPlan('');
                    setView('editor');
                }
            });
    };

    const handleSave = () => {
        const sanitizedEntries = {};
        if (entries) {
            for (const key in entries) {
                sanitizedEntries[key] = {
                    ...entries[key],
                    content: preserveSpaces(entries[key].content)
                };
            }
        }

        const dataToSave = {
            reporterName,
            startDate: format(startDate, 'yyyy-MM-dd'),
            entries: sanitizedEntries,
            nextWeekPlan: preserveSpaces(nextWeekPlan)
        };

        fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        })
            .then(res => res.json())
            .then(data => {
                setReportId(data.id);
                alert('保存しました');
            })
            .catch(err => {
                console.error('Failed to save report', err);
                alert('保存に失敗しました');
            });
    };

    const handleCreateNew = () => {
        console.log('Creating new report...');
        const today = new Date();
        const monday = getMonday(today);
        setReportId(null);
        setReporterName('');
        setStartDate(monday);
        setEntries({});
        setNextWeekPlan('');
        setView('editor');
    };

    const updateEntry = (dateKey, updates) => {
        setEntries(prev => ({
            ...prev,
            [dateKey]: { ...(prev[dateKey] || { content: '', isHoliday: false, span: 1 }), ...updates }
        }));
    };

    const handleMerge = (currentIndex, weekDates) => {
        let parentIndex = -1;
        for (let i = currentIndex - 1; i >= 0; i--) {
            const dKey = format(weekDates[i], 'yyyy-MM-dd');
            const entry = entries[dKey] || { span: 1 };
            const endOfBlock = i + (entry.span || 1) - 1;
            if (endOfBlock === currentIndex - 1) {
                parentIndex = i;
                break;
            }
        }
        if (parentIndex !== -1) {
            const parentDateKey = format(weekDates[parentIndex], 'yyyy-MM-dd');
            const parentEntry = entries[parentDateKey] || { span: 1 };
            updateEntry(parentDateKey, { span: (parentEntry.span || 1) + 1 });
        }
    };

    const handleUnmergeLast = (dateKey, currentSpan) => {
        if (currentSpan > 1) {
            updateEntry(dateKey, { span: currentSpan - 1 });
        }
    };

    const handlePrint = async () => {
        if (window.electronAPI && window.electronAPI.savePDF) {
            const result = await window.electronAPI.savePDF();
            if (result && result.success) {
                // 保存に成功した場合は何もしない（保存先ダイアログが終わっただけ）
            } else if (result && !result.canceled) {
                alert('PDF保存に失敗しました: ' + result.error);
            }
        } else {
            window.print();
        }
    };

    const handleDuplicate = (report) => {
        if (window.confirm(`${formatDateJP(new Date(report.startDate))} の日報を複製して作成しますか？\n（日付は1週間後に設定されます）`)) {
            // ダッシュボードの一覧には entries が含まれていないため、詳細を取得してから複製する
            fetch(`${API_BASE}/reports/${report.startDate}`)
                .then(res => res.json())
                .then(fullReport => {
                    setReportId(null); // 新規作成のためIDをクリア
                    setReporterName(fullReport.reporterName || '');
                    const nextDate = addDays(parseISO(fullReport.startDate), 7);
                    setStartDate(nextDate);

                    let parsedEntries = {};
                    try {
                        parsedEntries = typeof fullReport.entries === 'string' ? JSON.parse(fullReport.entries) : fullReport.entries;
                    } catch (e) {
                        console.error("Failed to parse entries for duplication", e);
                    }

                    // 日付キーを1週間後にずらした新しい entries オブジェクトを作成する
                    const shiftedEntries = {};
                    if (parsedEntries) {
                        Object.keys(parsedEntries).forEach(originalDateKey => {
                            const originalDate = parseISO(originalDateKey);
                            const shiftedDate = addDays(originalDate, 7);
                            const shiftedDateKey = format(shiftedDate, 'yyyy-MM-dd');
                            shiftedEntries[shiftedDateKey] = {
                                ...parsedEntries[originalDateKey],
                                content: preserveSpaces(parsedEntries[originalDateKey].content)
                            };
                        });
                    }

                    setEntries(shiftedEntries);
                    setNextWeekPlan(preserveSpaces(fullReport.nextWeekPlan || ''));
                    setView('editor');
                })
                .catch(err => {
                    console.error('Failed to fetch report details for duplication', err);
                    alert('複製元のデータ取得に失敗しました');
                });
        }
    };

    const renderMainContent = () => {
        if (view === 'dashboard') {
            return (
                <Dashboard
                    onSelectReport={(date) => loadReport(date)}
                    onCreateNew={handleCreateNew}
                    onDuplicate={handleDuplicate}
                />
            );
        }

        const weekDates = getWeekDays(startDate);
        const renderList = [];
        let skipCount = 0;

        weekDates.forEach((date, i) => {
            if (skipCount > 0) {
                skipCount--;
                return;
            }
            const dateKey = format(date, 'yyyy-MM-dd');
            const entry = entries[dateKey] || { content: '', isHoliday: false, span: 1 };
            let label = formatDateJP(date);
            if (entry.span > 1) {
                const endDate = addDays(date, entry.span - 1);
                label = `${formatDateJP(date)} ～ ${formatDateJP(endDate)}`;
            }
            renderList.push(
                <DailyEntry
                    key={dateKey}
                    date={date}
                    data={{ ...entry, customLabel: label }}
                    canMergePrevious={i > 0}
                    isMergedWithPrevious={false}
                    onUpdate={(updates) => {
                        if (updates.mergeWithPrevious) {
                            handleMerge(i, weekDates);
                        } else if (updates.unmergeLast) {
                            handleUnmergeLast(dateKey, entry.span);
                        } else {
                            updateEntry(dateKey, updates);
                        }
                    }}
                />
            );
            if (entry.span > 1) skipCount = entry.span - 1;
        });

        return (
            <div>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', width: '210mm' }} className="no-print">
                    <button onClick={() => setView('dashboard')} className="secondary-button">
                        ← 一覧に戻る
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSave} className="primary-button">
                            保存
                        </button>
                        <button onClick={handlePrint} style={{ padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                            印刷 / PDF保存
                        </button>
                    </div>
                </div>

                <div className="report-container">
                    <div className="title-section">
                        <span className="title-icon">📝</span>
                        業務日報(週報)
                    </div>

                    <ReportHeader
                        reporterName={reporterName}
                        setReporterName={setReporterName}
                        startDate={startDate}
                        setStartDate={setStartDate}
                    />

                    <div>
                        <div className="daily-section-title">今週（日報）</div>
                        <div className="entries-container">
                            {renderList}
                        </div>
                    </div>

                    <NextWeekPlan
                        content={nextWeekPlan}
                        setContent={setNextWeekPlan}
                    />
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary>
            {renderMainContent()}
        </ErrorBoundary>
    );
}

export default App;
