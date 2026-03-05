export type Language = 'ID' | 'EN';

export const translations = {
    ID: {
        // App Sidebar
        dashboard: 'Dashboard',
        my_requests: 'Pengajuan Saya',
        history: 'Riwayat Kasbon',
        approval_list: 'Daftar Persetujuan',
        governance: 'Governansi & Kebijakan',
        dept_settings: 'Pengaturan Dept',
        activity_logs: 'Log Aktifitas',
        proxy_settings: 'Pengaturan Proxy',
        add_slot: 'Slot Tambahan',
        logout: 'Keluar',
        management_label: 'ADMINISTRASI SISTEM',
        finance_label: 'OPERASI FINANCE',
        finance_approvals: 'Persetujuan Finance',
        review_realisasi: 'Review Realisasi',
        unrealized: 'Belum Realisasi',

        // Dashboard Stats
        total_expense: 'Total Pengeluaran Tahun Ini',
        avg_approval_time: 'Rata-rata Waktu Approval',
        outstanding_requests: 'Pengajuan Masih Aktif',
        active_slots: 'Slot Kasbon Aktif',
        outstanding: 'Tagihan Aktif',
        this_year: 'Total Tahun Ini',

        // Section Headers
        active_kasbon: 'Kasbon Aktif Anda',
        no_active_kasbon: 'Tidak Ada Kasbon Aktif',
        no_active_kasbon_desc: 'Semua pengajuan kasbon Anda telah diselesaikan (settled) atau belum ada pengajuan baru.',
        submit_new_kasbon: 'Buat Kasbon Baru',

        // Kasbon Detail
        kasbon_id: 'NOMOR KASBON',
        submitted_date: 'Tanggal Pengajuan',
        need_date: 'Tanggal Dibutuhkan',
        amount: 'Jumlah Dana',
        purpose: 'Tujuan Penggunaan',
        status: 'Status Saat Ini',
        approval_path: 'Alur Persetujuan',
        requestor: 'Pemohon',

        // Actions
        back: 'Kembali',
        approve: 'Setujui',
        reject: 'Tolak',
        submit: 'Kirim Pengajuan',
        cancel: 'Batal',
        realize: 'Realisasi',
        review: 'Review',

        // Slot Request
        slot_form_title: 'Form Penambahan Slot',
        slot_requested: 'Jumlah Slot Yang Diminta',
        slot_reason: 'Alasan',
        slot_current: 'Slot Saat Ini',
        slot_estimation: 'Estimasi Alur Persetujuan Slot',
        slot_reason_placeholder: 'Silahkan isikan detail alasan permintaan slot tambahan...',
        submit_slot_request: 'Ajukan Permintaan Slot',
        slot_quota_info: '(Penambahan +1 dari kuota saat ini: ',

        // Alerts & SweetAlerts
        confirm_approve_title: 'Setujui Pengajuan?',
        confirm_approve_text: 'Apakah Anda yakin ingin menyetujui pengajuan kasbon ini?',
        confirm_reject_title: 'Tolak Pengajuan?',
        confirm_reject_text: 'Berikan alasan singkat penolakan...',
        success_title: 'Berhasil',
        error_title: 'Gagal',
        approving_process: 'Memproses persetujuan...',
        slot_limit_reached_title: 'Slot Kasbon Penuh',
        slot_limit_reached_html: 'Departemen Anda sudah mencapai limit kasbon aktif. Silahkan ajukan penambahan slot sementara jika ada kebutuhan mendesak.',
        ajukan_slot_sekarang: 'Ajukan Slot Tambahan',
        nanti_saja: 'Nanti Saja',
        slot_available_title: 'Slot Masih Tersedia',
        slot_available_html: 'Anda masih memiliki slot tersedia. Anda hanya bisa mengajukan penambahan slot jika semua slot sudah terpakai.',

        // Approval List View
        approval_view_title: 'Persetujuan Kasbon & Slot',
        approval_view_desc: 'Daftar pengajuan yang memerlukan persetujuan Anda',
        approval_empty_state: 'Semua persetujuan sudah selesai dikerjakan!',

        // Slot Approval Screen
        slot_approval_title: 'Persetujuan Tambah Slot',
        slot_req_management: 'Request Slot Kasbon Sementara',
        slot_id: 'ID Request',
        slot_request_path: 'Alur Persetujuan Slot',
        confirm_reject_slot_title: 'Tolak Permintaan Slot?',
        confirm_reject_slot_text: 'Apakah Anda yakin ingin menolak permintaan penambahan slot ini?',
        confirm_approve_slot_title: 'Setujui Permintaan Slot?',
        confirm_approve_slot_html: 'Tambahkan quota slot untuk departemen ',
        slot_info_banner: 'Perubahan di sini akan mempengaruhi alur persetujuan saat user melakukan pengajuan Slot Tambahan.',
    },
    EN: {
        // App Sidebar
        dashboard: 'Dashboard',
        my_requests: 'My Requests',
        history: 'Kasbon History',
        approval_list: 'Approval List',
        governance: 'Governance & Policies',
        dept_settings: 'Dept Settings',
        activity_logs: 'Activity Logs',
        proxy_settings: 'Proxy Settings',
        add_slot: 'Extra Slot Request',
        logout: 'Logout',
        management_label: 'SYSTEM ADMINISTRATION',
        finance_label: 'FINANCE OPERATIONS',
        finance_approvals: 'Finance Approvals',
        review_realisasi: 'Review Realization',
        unrealized: 'Unrealized',

        // Dashboard Stats
        total_expense: 'Total Expenses This Year',
        avg_approval_time: 'Avg. Approval Time',
        outstanding_requests: 'Outstanding Requests',
        active_slots: 'Active Kasbon Slots',
        outstanding: 'Outstanding',
        this_year: 'Total This Year',

        // Section Headers
        active_kasbon: 'Your Active Kasbon',
        no_active_kasbon: 'No Active Kasbon',
        no_active_kasbon_desc: 'All your requests are settled or there are no new requests.',
        submit_new_kasbon: 'Submit New Kasbon',

        // Kasbon Detail
        kasbon_id: 'KASBON ID',
        submitted_date: 'Date Submitted',
        need_date: 'Date Needed',
        amount: 'Amount',
        purpose: 'Purpose',
        status: 'Current Status',
        approval_path: 'Approval Journey',
        requestor: 'Requestor',

        // Actions
        back: 'Back',
        approve: 'Approve',
        reject: 'Reject',
        submit: 'Submit Request',
        cancel: 'Cancel',
        realize: 'Realization',
        review: 'Review',

        // Slot Request
        slot_form_title: 'Slot Exception Form',
        slot_requested: 'Requested Slots',
        slot_reason: 'Reason',
        slot_current: 'Current Slots',
        slot_estimation: 'Estimated Approval Journey',
        slot_reason_placeholder: 'Please provide details for the extra slot request...',
        submit_slot_request: 'Submit Slot Request',
        slot_quota_info: '(Adding +1 from current quota: ',

        // Alerts & SweetAlerts
        confirm_approve_title: 'Approve Request?',
        confirm_approve_text: 'Are you sure you want to approve this request?',
        confirm_reject_title: 'Reject Request?',
        confirm_reject_text: 'Please provide a reason for rejection...',
        success_title: 'Success',
        error_title: 'Error',
        approving_process: 'Processing approval...',
        slot_limit_reached_title: 'Kasbon Slots Full',
        slot_limit_reached_html: 'Your department has reached the active kasbon limit. Please request a temporary slot if there is an urgent need.',
        ajukan_slot_sekarang: 'Request Extra Slot',
        nanti_saja: 'Maybe Later',
        slot_available_title: 'Slots Still Available',
        slot_available_html: 'You still have available slots. You can only request extra slots if all current slots are utilized.',

        // Approval List View
        approval_view_title: 'Kasbon & Slot Approvals',
        approval_view_desc: 'List of requests requiring your approval',
        approval_empty_state: 'All approvals are completed!',

        // Slot Approval Screen
        slot_approval_title: 'Extra Slot Approval',
        slot_req_management: 'Temporary Slot Exception Request',
        slot_id: 'Request ID',
        slot_request_path: 'Slot Approval Journey',
        confirm_reject_slot_title: 'Reject Slot Request?',
        confirm_reject_slot_text: 'Are you sure you want to reject this extra slot request?',
        confirm_approve_slot_title: 'Approve Slot Request?',
        confirm_approve_slot_html: 'Add slot quota for department ',
        slot_info_banner: 'Changes here will affect the approval journey when users request an Extra Slot.',
    }
};

export type TranslationKey = keyof typeof translations.ID;
