// 앱 상태 관리
const state = {
    records: [],
    grades: { '2': [1, 2, 3, 4, 5, 6, 7, 8], '1': [1, 2, 3, 4] }
};

// DOM 요소
const dateInput = document.getElementById('date');
const gradeSelect = document.getElementById('grade');
const classSelect = document.getElementById('class');
const periodSelect = document.getElementById('period');
const progressInput = document.getElementById('progress');
const memoInput = document.getElementById('memo');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const searchBtn = document.getElementById('searchBtn');
const recordsList = document.getElementById('recordsList');
const filterDate = document.getElementById('filterDate');
const filterGrade = document.getElementById('filterGrade');
const filterClass = document.getElementById('filterClass');

// 초기화
function init() {
    // 오늘 날짜 기본값
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    filterDate.value = today;
    
    // 저���된 데이터 로드
    loadData();
    
    // 반 드롭다운 업데이트
    updateClassOptions();
    updateFilterClassOptions();
    
    // 이벤트 리스너
    gradeSelect.addEventListener('change', updateClassOptions);
    filterGrade.addEventListener('change', updateFilterClassOptions);
    filterClass.addEventListener('change', filterRecords);
    filterDate.addEventListener('change', filterRecords);
    
    saveBtn.addEventListener('click', saveRecord);
    clearBtn.addEventListener('click', confirmClear);
    exportBtn.addEventListener('click', exportToGoogleSheets);
    searchBtn.addEventListener('click', filterRecords);
    
    // 초기 조회
    filterRecords();
}

// 반 옵션 업데이트
function updateClassOptions() {
    const grade = gradeSelect.value;
    classSelect.innerHTML = '<option value="">반 선택</option>';
    
    if (grade) {
        const classes = state.grades[grade];
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = `${cls}반`;
            classSelect.appendChild(option);
        });
    }
}

// 필터용 반 옵션 업데이트
function updateFilterClassOptions() {
    const grade = filterGrade.value;
    filterClass.innerHTML = '<option value="">전체 반</option>';
    
    if (grade) {
        const classes = state.grades[grade];
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = `${cls}반`;
            filterClass.appendChild(option);
        });
    } else {
        // 학년을 선택 해제하면 반도 초기화
        filterClass.value = '';
    }
}

// 기록 저장
function saveRecord() {
    const date = dateInput.value;
    const grade = gradeSelect.value;
    const cls = classSelect.value;
    const period = periodSelect.value;
    const progress = progressInput.value;
    const memo = memoInput.value;
    
    // 검증
    if (!date || !grade || !cls || !period) {
        alert('필수 항목을 입력해주세요.');
        return;
    }
    
    // 기록 객체
    const record = {
        id: Date.now(),
        date,
        grade,
        class: cls,
        period,
        progress: progress || '-',
        memo,
        createdAt: new Date().toISOString()
    };
    
    state.records.push(record);
    saveData();
    resetForm();
    
    showNotification('저장되었습니다!');
}

// 폼 초기화
function resetForm() {
    gradeSelect.value = '';
    classSelect.value = '';
    periodSelect.value = '';
    progressInput.value = '';
    memoInput.value = '';
    classSelect.innerHTML = '<option value="">반 선택</option>';
}

// 기록 삭제
function deleteRecord(id) {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
        state.records = state.records.filter(r => r.id !== id);
        saveData();
        filterRecords();
        showNotification('삭제되었습니다.');
    }
}

// 기록 편집
function editRecord(id) {
    const record = state.records.find(r => r.id === id);
    if (record) {
        dateInput.value = record.date;
        gradeSelect.value = record.grade;
        updateClassOptions();
        classSelect.value = record.class;
        periodSelect.value = record.period;
        progressInput.value = record.progress === '-' ? '' : record.progress;
        memoInput.value = record.memo;
        
        deleteRecord(id);
        dateInput.focus();
    }
}

// 필터링된 기록 조회
function getFilteredRecords() {
    let filtered = [...state.records];
    
    if (filterDate.value) {
        filtered = filtered.filter(r => r.date === filterDate.value);
    }
    
    if (filterGrade.value) {
        filtered = filtered.filter(r => r.grade === filterGrade.value);
    }
    
    if (filterClass.value) {
        filtered = filtered.filter(r => r.class === filterClass.value);
    }
    
    return filtered.sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return b.id - a.id;
    });
}

// 필터 상태 표시
function getFilterStatus() {
    const filters = [];
    
    if (filterDate.value) {
        const date = new Date(filterDate.value + 'T00:00:00');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        filters.push(`📅 ${date.getFullYear()}-${month}-${day}`);
    }
    
    if (filterGrade.value) {
        filters.push(`${filterGrade.value}학년`);
    }
    
    if (filterClass.value) {
        filters.push(`${filterClass.value}반`);
    }
    
    return filters.length > 0 ? `✨ 필터: ${filters.join(', ')}` : '📋 전체 기록';
}

// 기록 렌더링
function renderRecords() {
    const filtered = getFilteredRecords();
    const filterStatus = getFilterStatus();
    
    // 필터 상태 표시
    const listHeader = document.querySelector('.list-section h2');
    if (listHeader) {
        listHeader.textContent = `${filterStatus}`;
    }
    
    if (filtered.length === 0) {
        recordsList.innerHTML = '<div class="empty-message">기록이 없습니다.</div>';
        return;
    }
    
    recordsList.innerHTML = filtered.map(record => `
        <div class="record-item">
            <div class="record-header">
                <div class="record-title">🏫 ${record.grade}학년 ${record.class}반</div>
                <div class="record-meta">
                    <span>🕐 ${record.period}교시</span>
                </div>
            </div>
            <div class="record-meta">
                <span>📅 ${formatDate(record.date)}</span>
                <span>📄 ${record.progress}p</span>
            </div>
            ${record.memo ? `<div class="record-memo">📝 ${record.memo}</div>` : ''}
            <div class="record-actions">
                <button class="btn-secondary" onclick="editRecord(${record.id})">✏️ 수정</button>
                <button class="btn-danger" onclick="deleteRecord(${record.id})">🗑️ 삭제</button>
            </div>
        </div>
    `).join('');
}

// 필터 적용 함수
function filterRecords() {
    renderRecords();
}

// 데이터 저장 (LocalStorage)
function saveData() {
    localStorage.setItem('classProgressData', JSON.stringify(state.records));
}

// 데이터 로드 (LocalStorage)
function loadData() {
    const data = localStorage.getItem('classProgressData');
    if (data) {
        state.records = JSON.parse(data);
    }
}

// 전체 삭제 확인
function confirmClear() {
    if (confirm('정말 모든 데이터를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
        state.records = [];
        saveData();
        filterRecords();
        showNotification('모든 데이터가 삭제되었습니다.');
    }
}

// Google Sheets로 내보내기
function exportToGoogleSheets() {
    const dataToExport = getFilteredRecords();
    
    if (dataToExport.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    // CSV 데이터 생성
    let csv = '날짜,학년,반,교시,진도(페이지),특이사항\n';
    
    dataToExport.forEach(record => {
        const date = formatDate(record.date);
        const memo = `"${record.memo.replace(/"/g, '""')}"`;
        csv += `${date},${record.grade},${record.class},${record.period},${record.progress},${memo}\n`;
    });
    
    // Google Sheets Import URL
    const sheetsUrl = `https://docs.google.com/spreadsheets/u/0/create?title=수업진도관리_${new Date().toISOString().split('T')[0]}`;
    
    // 클립보드에 CSV 복사
    navigator.clipboard.writeText(csv).then(() => {
        alert(`데이터가 클립보드에 복사되었습니다!\n\n다음 단계:\n1. "확인" 버튼을 누르면 Google Sheets가 열립니다\n2. 새로운 시트에서 Ctrl+V (또는 Cmd+V)를 눌러 붙여넣기\n3. 자유롭게 편집하고 관리하세요!`);
        window.open(sheetsUrl, '_blank');
    }).catch(() => {
        // 클립보드 실패 시 대체 방법
        alert('Google Sheets 새 문서를 만들고 다음 데이터를 붙여넣으세요:\n\n' + csv);
        window.open(sheetsUrl, '_blank');
    });
}

// 날짜 포매팅
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${date.getFullYear()}-${month}-${day} (${dayOfWeek})`;
}

// 알림 표시
function showNotification(message) {
    // 간단한 알림 (선택적 개선 가능)
    console.log(message);
}

// 앱 시작
window.addEventListener('DOMContentLoaded', init);

// 앱 설치 프롬프트
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});
