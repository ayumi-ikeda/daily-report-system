import React from 'react';
import { formatDateJP } from '../utils/dateUtils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const DailyEntry = ({
    date,
    data,
    onUpdate,
    canMergePrevious,
    isMergedWithPrevious,
    nextDayIsMerged
}) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

    if (isMergedWithPrevious) {
        return null;
    }

    const handleDateClick = (e) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    const handleMenuSelect = (action) => {
        setShowMenu(false);
        onUpdate({ ...data, ...action });
    };

    // Determine pill style
    const isFilled = data.content && data.content.trim().length > 0 && data.content !== '<p><br></p>';
    const pillClass = (isFilled && !data.isHoliday) ? 'orange' : 'gray';

    // Quill modules configuration
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    };

    return (
        <div className="daily-entry-wrapper">
            <div
                className={`date-pill ${pillClass}`}
                onClick={handleDateClick}
            >
                {data.customLabel || formatDateJP(date)}
            </div>

            {data.isHoliday && <span className="holiday-label">祝日</span>}

            {!data.isHoliday && (
                <div className="quill-editor-container">
                    <ReactQuill
                        theme="snow"
                        value={data.content || ''}
                        onChange={(content) => onUpdate({ ...data, content })}
                        modules={modules}
                        placeholder="内容を入力..."
                    />
                </div>
            )}

            {showMenu && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="popover-menu" style={{ top: menuPos.y, left: menuPos.x }}>
                        <div className="popover-item" onClick={() => handleMenuSelect({ isHoliday: false })}>
                            就業日 (通常)
                        </div>
                        <div className="popover-item" onClick={() => handleMenuSelect({ isHoliday: true, content: '' })}>
                            祝祭日
                        </div>
                        {canMergePrevious && (
                            <div className="popover-item" onClick={() => handleMenuSelect({ mergeWithPrevious: true })}>
                                前日と同じ
                            </div>
                        )}
                        {daySpansMultiple(data) && (
                            <div className="popover-item" onClick={() => handleMenuSelect({ unmergeLast: true })}>
                                解除 (最終日を分離)
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Helper utility for checking if data spans
function daySpansMultiple(data) {
    return data.span > 1;
}

export default DailyEntry;
