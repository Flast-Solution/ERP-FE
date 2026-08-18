export const TITLE = 'Thiết lập KPI';

export const PERIODS = [
  { key: 'q1', label: 'Quý 1/2026', evaluation: 'Quý 1/2026' },
  { key: 'q2', label: 'Quý 2/2026', evaluation: 'Quý 2/2026' },
  { key: 'year', label: 'Cả năm 2026', evaluation: 'Năm 2026' },
];

export const KPI_NAMES = 'Số mẫu kiểm định hoàn thành, Thời gian xử lý mẫu trung bình, Tỷ lệ mẫu đạt chuẩn, Mức độ tuân thủ quy trình';

export const MOCK_EMPLOYEES = [
  {
    id: 1,
    initials: 'TB',
    name: 'Trần Thị B',
    role: 'KTV kiểm định viên',
    department: 'Phòng QC — Kiểm định vải',
    indicatorCount: 4,
    progress: 104,
    status: 'success',
  },
  {
    id: 2,
    initials: 'LC',
    name: 'Lê Văn C',
    role: 'KTV kiểm định viên',
    department: 'Phòng QC — Kiểm định vải',
    indicatorCount: 4,
    progress: 78,
    status: 'active',
  },
  {
    id: 3,
    initials: 'NA',
    name: 'Nguyễn Văn A',
    role: 'Trưởng ca kiểm định',
    department: 'Phòng QC — Kiểm định vải',
    indicatorCount: 4,
    progress: 65,
    status: 'warning',
  },
  {
    id: 4,
    initials: 'PD',
    name: 'Phạm Thị D',
    role: 'KTV hiệu chuẩn thiết bị',
    department: 'Phòng QC — Hiệu chuẩn',
    indicatorCount: 4,
    progress: 42,
    status: 'warning',
  },
  {
    id: 5,
    initials: 'HE',
    name: 'Hoàng Văn E',
    role: 'KTV kiểm định viên (mới)',
    department: 'Phòng QC — Kiểm định vải',
    indicatorCount: 4,
    progress: 0,
    status: 'pending',
  },
];

export const STATUS_META = {
  success: { label: 'Đạt mục tiêu', color: '#15803d', background: '#dcfce7', border: '#a7f3d0' },
  active: { label: 'Đang thực hiện', color: '#2563eb', background: '#dbeafe', border: '#bfdbfe' },
  warning: { label: 'Cần theo dõi', color: '#a16207', background: '#fef3c7', border: '#fde68a' },
  pending: { label: 'Chưa bắt đầu', color: '#64748b', background: '#f1f5f9', border: '#cbd5e1' },
};

export const MOCK_KPI_DETAILS = [
  {
    id: 'samples_completed',
    name: 'Số mẫu kiểm định hoàn thành',
    code: 'samples_completed',
    weight: 30,
    progress: 110,
    status: 'success',
    target: '≥ 180 mẫu',
    actual: '198 mẫu / quý',
    unit: 'mẫu / quý',
    description: 'Tổng số mẫu vải đã hoàn tất toàn bộ quy trình kiểm định (từ tiếp nhận đến cấp chứng nhận hoặc từ chối) trong kỳ.',
  },
  {
    id: 'avg_turnaround',
    name: 'Thời gian xử lý mẫu trung bình',
    code: 'avg_turnaround',
    weight: 25,
    progress: 96,
    status: 'active',
    target: '≤ 36 giờ',
    actual: '37,4 giờ / mẫu',
    unit: 'giờ / mẫu',
    description: 'Thời gian trung bình từ lúc tiếp nhận mẫu đến khi có kết quả kiểm định cuối cùng.',
  },
  {
    id: 'retest_rate',
    name: 'Tỷ lệ mẫu tái kiểm định',
    code: 'retest_rate',
    weight: 20,
    progress: 107,
    status: 'success',
    target: '≤ 5 %',
    actual: '4,6 %',
    unit: '%',
    description: 'Tỷ lệ mẫu phải kiểm định lại do sai lệch số liệu hoặc khiếu nại từ khách hàng.',
  },
  {
    id: 'sop_compliance',
    name: 'Tuân thủ SOP kiểm định',
    code: 'sop_compliance',
    weight: 25,
    progress: 100,
    status: 'success',
    target: '≥ 90 điểm',
    actual: '90 điểm audit',
    unit: 'điểm audit',
    description: 'Điểm audit nội bộ định kỳ đánh giá mức độ tuân thủ quy trình thao tác chuẩn (SOP) khi thực hiện các phép thử.',
  },
];
