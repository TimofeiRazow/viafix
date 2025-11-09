import * as XLSX from 'xlsx';

export const generateExcelReport = async (stats, dateRange) => {
  // Создаем новую рабочую книгу
  const workbook = XLSX.utils.book_new();

  // Лист с общей статистикой
  const summaryData = [
    ['Отчет по жалобам ViaFix'],
    ['Период', `${dateRange.start} - ${dateRange.end}`],
    ['Всего жалоб', stats.total],
    ['Решено жалоб', stats.byStatus.resolved || 0],
    ['Эффективность', `${Math.round(((stats.byStatus.resolved || 0) / stats.total) * 100) || 0}%`],
    [],
    ['Статистика по статусам'],
    ...Object.entries(stats.byStatus).map(([status, count]) => [
      getStatusLabel(status),
      count,
      `${Math.round((count / stats.total) * 100)}%`
    ]),
    [],
    ['Статистика по категориям'],
    ...Object.entries(stats.byCategory).map(([category, count]) => [
      getCategoryLabel(category),
      count,
      `${Math.round((count / stats.total) * 100)}%`
    ])
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Общая статистика');

  // Лист с ежедневной статистикой
  const dailyData = [
    ['Дата', 'Количество жалоб'],
    ...stats.dailyCount.map(day => [
      new Date(day.date).toLocaleDateString('ru-RU'),
      day.count
    ])
  ];

  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'По дням');

  // Генерируем файл и скачиваем
  const fileName = `ViaFix_Report_${dateRange.start}_${dateRange.end}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Ожидают',
    processing: 'В обработке',
    in_progress: 'В работе',
    resolved: 'Решены',
    rejected: 'Отклонены'
  };
  return labels[status] || status;
};

const getCategoryLabel = (category) => {
  const labels = {
    pothole: 'Ямы',
    multiple_potholes: 'Множественные ямы',
    possible_pothole: 'Возможные ямы',
    manhole: 'Люки',
    sidewalk_damage: 'Повреждения тротуара',
    unknown: 'Неизвестно',
    error: 'Ошибка'
  };
  return labels[category] || category;
};