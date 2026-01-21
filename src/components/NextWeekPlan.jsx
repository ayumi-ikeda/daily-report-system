import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const NextWeekPlan = ({ content, setContent }) => {
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    };

    return (
        <div className="next-week-wrapper">
            <div className="daily-section-title">次週（予定）</div>
            <div className="next-week-container">
                <ReactQuill
                    theme="snow"
                    value={content || ''}
                    onChange={setContent}
                    modules={modules}
                    placeholder="来週の予定を入力..."
                />
            </div>
        </div>
    );
};

export default NextWeekPlan;
