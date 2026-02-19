import { PrismaClient, UserRole, UserStatus, EquipmentStatus } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (desenvolvimento apenas)
  await prisma.auditLog.deleteMany();
  await prisma.calibrationRecord.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.calibrationRule.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.sector.deleteMany();
  // Não deletar users para não perder o CRIADOR

  console.log('🗑️  Dados anteriores limpos');

  // Criar Setores
  console.log('📁 Criando setores...');
  const setores = await Promise.all([
    prisma.sector.create({
      data: { name: 'Produção', code: 'PROD', description: 'Setor de produção industrial' } as any,
    }),
    prisma.sector.create({
      data: { name: 'Qualidade', code: 'QUAL', description: 'Controle de qualidade' } as any,
    }),
    prisma.sector.create({
      data: { name: 'Manutenção', code: 'MANUT', description: 'Manutenção de equipamentos' } as any,
    }),
    prisma.sector.create({
      data: { name: 'Laboratório', code: 'LAB', description: 'Laboratório de análises' } as any,
    }),
    prisma.sector.create({
      data: { name: 'Almoxarifado', code: 'ALM', description: 'Gestão de materiais' } as any,
    }),
  ]);
  console.log(`✅ ${setores.length} setores criados`);

  // Criar Tipos de Equipamento
  console.log('🔧 Criando tipos de equipamento...');
  const tipos = await Promise.all([
    prisma.equipmentType.create({ data: { name: 'Paquímetro' } as any }),
    prisma.equipmentType.create({ data: { name: 'Balança' } as any }),
    prisma.equipmentType.create({ data: { name: 'Termômetro' } as any }),
    prisma.equipmentType.create({ data: { name: 'Micrômetro' } as any }),
    prisma.equipmentType.create({ data: { name: 'Trena' } as any }),
    prisma.equipmentType.create({ data: { name: 'Manômetro' } as any }),
    prisma.equipmentType.create({ data: { name: 'Multímetro' } as any }),
    prisma.equipmentType.create({ data: { name: 'Cronômetro' } as any }),
  ]);
  console.log(`✅ ${tipos.length} tipos de equipamento criados`);

  // Criar Regras de Calibração
  console.log('📋 Criando regras de calibração...');
  const regras = await Promise.all([
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[0].id, intervalMonths: 12, warnDays: 30 }, // Paquímetro - 12 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[1].id, intervalMonths: 6, warnDays: 15 }, // Balança - 6 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[2].id, intervalMonths: 12, warnDays: 30 }, // Termômetro - 12 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[3].id, intervalMonths: 12, warnDays: 30 }, // Micrômetro - 12 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[4].id, intervalMonths: 24, warnDays: 60 }, // Trena - 24 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[5].id, intervalMonths: 6, warnDays: 15 }, // Manômetro - 6 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[6].id, intervalMonths: 18, warnDays: 45 }, // Multímetro - 18 meses
    }),
    prisma.calibrationRule.create({
      data: { equipmentTypeId: tipos[7].id, intervalMonths: 12, warnDays: 30 }, // Cronômetro - 12 meses
    }),
  ]);
  console.log(`✅ ${regras.length} regras de calibração criadas`);

  // Criar Equipamentos com datas variadas
  console.log('⚙️  Criando equipamentos...');

  const hoje = new Date();
  const umMesAtras = new Date(hoje);
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);
  const doisMesesAtras = new Date(hoje);
  doisMesesAtras.setMonth(doisMesesAtras.getMonth() - 2);
  const seisMesesAtras = new Date(hoje);
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
  const dezMesesAtras = new Date(hoje);
  dezMesesAtras.setMonth(dezMesesAtras.getMonth() - 10);
  const umAnoAtras = new Date(hoje);
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  const doisAnosAtras = new Date(hoje);
  doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);

  const equipamentos = await Promise.all([
    // Produção - 6 equipamentos
    prisma.equipment.create({
      data: {
        name: 'Paquímetro Digital 150mm',
        code: 'PAQ-001',
        manufacturerModel: 'Mitutoyo CD-6 CSX',
        resolution: '0.01mm',
        capacity: '150mm',
        responsible: 'João Silva',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[0].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-001',
        dueDate: new Date(umMesAtras.getTime() + 365 * 24 * 60 * 60 * 1000), // +12 meses
        status: EquipmentStatus.CALIBRADO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Balança de Precisão',
        code: 'BAL-001',
        manufacturerModel: 'Shimadzu AUW220D',
        resolution: '0.1mg',
        capacity: '220g',
        responsible: 'Maria Santos',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[1].id,
        lastCalibrationDate: doisMesesAtras,
        lastCertificateNumber: 'CERT-2025-045',
        dueDate: new Date(doisMesesAtras.getTime() + 180 * 24 * 60 * 60 * 1000), // +6 meses
        status: EquipmentStatus.IRA_VENCER, // ~4 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Termômetro Digital',
        code: 'TERM-001',
        manufacturerModel: 'Fluke 54-II',
        resolution: '0.1°C',
        capacity: '-200°C a 1372°C',
        responsible: 'Carlos Oliveira',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[2].id,
        lastCalibrationDate: umAnoAtras,
        lastCertificateNumber: 'CERT-2025-012',
        dueDate: hoje, // Vence hoje
        status: EquipmentStatus.IRA_VENCER,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Micrômetro Externo 25mm',
        code: 'MIC-001',
        manufacturerModel: 'Starrett 293',
        resolution: '0.001mm',
        capacity: '0-25mm',
        responsible: 'Ana Costa',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[3].id,
        lastCalibrationDate: doisAnosAtras,
        lastCertificateNumber: 'CERT-2024-078',
        dueDate: umAnoAtras, // Vencido há 1 ano
        status: EquipmentStatus.VENCIDO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Trena Laser 50m',
        code: 'TRE-001',
        manufacturerModel: 'Bosch GLM 50',
        resolution: '1mm',
        capacity: '50m',
        responsible: 'Pedro Alves',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[4].id,
        lastCalibrationDate: seisMesesAtras,
        lastCertificateNumber: 'CERT-2025-089',
        dueDate: new Date(seisMesesAtras.getTime() + 730 * 24 * 60 * 60 * 1000), // +24 meses
        status: EquipmentStatus.CALIBRADO, // ~18 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Manômetro Digital',
        code: 'MAN-001',
        manufacturerModel: 'Druck DPI 104',
        resolution: '0.01 bar',
        capacity: '0-20 bar',
        responsible: 'Lucas Ferreira',
        sectorId: setores[0].id,
        equipmentTypeId: tipos[5].id,
        lastCalibrationDate: seisMesesAtras,
        lastCertificateNumber: 'CERT-2025-067',
        dueDate: hoje, // Vence hoje (6 meses após calibração)
        status: EquipmentStatus.IRA_VENCER,
      },
    }),

    // Qualidade - 5 equipamentos
    prisma.equipment.create({
      data: {
        name: 'Paquímetro Analógico 300mm',
        code: 'PAQ-002',
        manufacturerModel: 'Starrett 125',
        resolution: '0.02mm',
        capacity: '300mm',
        responsible: 'Fernanda Lima',
        sectorId: setores[1].id,
        equipmentTypeId: tipos[0].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-002',
        dueDate: new Date(umMesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Balança Analítica',
        code: 'BAL-002',
        manufacturerModel: 'Sartorius Practum',
        resolution: '0.1mg',
        capacity: '220g',
        responsible: 'Roberto Souza',
        sectorId: setores[1].id,
        equipmentTypeId: tipos[1].id,
        lastCalibrationDate: dezMesesAtras,
        lastCertificateNumber: 'CERT-2025-023',
        dueDate: new Date(dezMesesAtras.getTime() + 180 * 24 * 60 * 60 * 1000), // Vencido
        status: EquipmentStatus.VENCIDO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Termômetro Infravermelho',
        code: 'TERM-002',
        manufacturerModel: 'Fluke 62 MAX',
        resolution: '1°C',
        capacity: '-30°C a 500°C',
        responsible: 'Juliana Rocha',
        sectorId: setores[1].id,
        equipmentTypeId: tipos[2].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-003',
        dueDate: new Date(umMesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Micrômetro Interno 50mm',
        code: 'MIC-002',
        manufacturerModel: 'Mitutoyo 141',
        resolution: '0.01mm',
        capacity: '50-75mm',
        responsible: 'Marcos Barros',
        sectorId: setores[1].id,
        equipmentTypeId: tipos[3].id,
        lastCalibrationDate: dezMesesAtras,
        lastCertificateNumber: 'CERT-2025-034',
        dueDate: new Date(dezMesesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.IRA_VENCER, // ~2 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Multímetro Digital',
        code: 'MULT-001',
        manufacturerModel: 'Fluke 87V',
        resolution: '0.1mV',
        capacity: '1000V',
        responsible: 'Sandra Mendes',
        sectorId: setores[1].id,
        equipmentTypeId: tipos[6].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-004',
        dueDate: new Date(umMesAtras.getTime() + 545 * 24 * 60 * 60 * 1000), // +18 meses
        status: EquipmentStatus.CALIBRADO,
      },
    }),

    // Manutenção - 4 equipamentos
    prisma.equipment.create({
      data: {
        name: 'Trena Metálica 5m',
        code: 'TRE-002',
        manufacturerModel: 'Stanley FatMax',
        resolution: '1mm',
        capacity: '5m',
        responsible: 'Antônio Dias',
        sectorId: setores[2].id,
        equipmentTypeId: tipos[4].id,
        lastCalibrationDate: umAnoAtras,
        lastCertificateNumber: 'CERT-2025-011',
        dueDate: new Date(umAnoAtras.getTime() + 730 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~12 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Manômetro Analógico',
        code: 'MAN-002',
        manufacturerModel: 'Wika 111',
        resolution: '0.1 bar',
        capacity: '0-10 bar',
        responsible: 'Ricardo Gomes',
        sectorId: setores[2].id,
        equipmentTypeId: tipos[5].id,
        lastCalibrationDate: umAnoAtras,
        lastCertificateNumber: 'CERT-2025-015',
        dueDate: new Date(umAnoAtras.getTime() + 180 * 24 * 60 * 60 * 1000), // Vencido
        status: EquipmentStatus.VENCIDO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Multímetro de Bancada',
        code: 'MULT-002',
        manufacturerModel: 'Keysight 34461A',
        resolution: '0.01mV',
        capacity: '1000V',
        responsible: 'Beatriz Martins',
        sectorId: setores[2].id,
        equipmentTypeId: tipos[6].id,
        lastCalibrationDate: seisMesesAtras,
        lastCertificateNumber: 'CERT-2025-078',
        dueDate: new Date(seisMesesAtras.getTime() + 545 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~12 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Cronômetro Digital',
        code: 'CRON-001',
        manufacturerModel: 'Casio HS-3V',
        resolution: '0.01s',
        capacity: '10h',
        responsible: 'Gustavo Silva',
        sectorId: setores[2].id,
        equipmentTypeId: tipos[7].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-005',
        dueDate: new Date(umMesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO,
      },
    }),

    // Laboratório - 5 equipamentos
    prisma.equipment.create({
      data: {
        name: 'Balança de Precisão 500g',
        code: 'BAL-003',
        manufacturerModel: 'Mettler Toledo XPE',
        resolution: '0.001g',
        capacity: '500g',
        responsible: 'Patrícia Almeida',
        sectorId: setores[3].id,
        equipmentTypeId: tipos[1].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-006',
        dueDate: new Date(umMesAtras.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~5 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Termômetro Calibrador',
        code: 'TERM-003',
        manufacturerModel: 'Hart Scientific 9102',
        resolution: '0.01°C',
        capacity: '-25°C a 155°C',
        responsible: 'Eduardo Santos',
        sectorId: setores[3].id,
        equipmentTypeId: tipos[2].id,
        lastCalibrationDate: seisMesesAtras,
        lastCertificateNumber: 'CERT-2025-090',
        dueDate: new Date(seisMesesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~6 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Paquímetro de Profundidade',
        code: 'PAQ-003',
        manufacturerModel: 'Mitutoyo 571',
        resolution: '0.01mm',
        capacity: '200mm',
        responsible: 'Camila Rodrigues',
        sectorId: setores[3].id,
        equipmentTypeId: tipos[0].id,
        lastCalibrationDate: dezMesesAtras,
        lastCertificateNumber: 'CERT-2025-035',
        dueDate: new Date(dezMesesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.IRA_VENCER, // ~2 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Micrômetro de Profundidade',
        code: 'MIC-003',
        manufacturerModel: 'Starrett 440',
        resolution: '0.01mm',
        capacity: '0-75mm',
        responsible: 'Renato Oliveira',
        sectorId: setores[3].id,
        equipmentTypeId: tipos[3].id,
        lastCalibrationDate: umMesAtras,
        lastCertificateNumber: 'CERT-2026-007',
        dueDate: new Date(umMesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Cronômetro Profissional',
        code: 'CRON-002',
        manufacturerModel: 'Seiko S141',
        resolution: '0.001s',
        capacity: '10h',
        responsible: 'Isabela Costa',
        sectorId: setores[3].id,
        equipmentTypeId: tipos[7].id,
        lastCalibrationDate: seisMesesAtras,
        lastCertificateNumber: 'CERT-2025-091',
        dueDate: new Date(seisMesesAtras.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~6 meses restantes
      },
    }),

    // Almoxarifado - 3 equipamentos
    prisma.equipment.create({
      data: {
        name: 'Balança de Plataforma',
        code: 'BAL-004',
        manufacturerModel: 'Toledo 2098',
        resolution: '10g',
        capacity: '300kg',
        responsible: 'Thiago Nunes',
        sectorId: setores[4].id,
        equipmentTypeId: tipos[1].id,
        lastCalibrationDate: doisMesesAtras,
        lastCertificateNumber: 'CERT-2025-046',
        dueDate: new Date(doisMesesAtras.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.IRA_VENCER, // ~4 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Trena Digital 100m',
        code: 'TRE-003',
        manufacturerModel: 'Leica DISTO D2',
        resolution: '1mm',
        capacity: '100m',
        responsible: 'Vanessa Ribeiro',
        sectorId: setores[4].id,
        equipmentTypeId: tipos[4].id,
        lastCalibrationDate: umAnoAtras,
        lastCertificateNumber: 'CERT-2025-013',
        dueDate: new Date(umAnoAtras.getTime() + 730 * 24 * 60 * 60 * 1000),
        status: EquipmentStatus.CALIBRADO, // ~12 meses restantes
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Termômetro Ambiente',
        code: 'TERM-004',
        manufacturerModel: 'Incoterm 7429',
        resolution: '0.5°C',
        capacity: '-10°C a 50°C',
        responsible: 'Daniel Pereira',
        sectorId: setores[4].id,
        equipmentTypeId: tipos[2].id,
        lastCalibrationDate: doisAnosAtras,
        lastCertificateNumber: 'CERT-2024-056',
        dueDate: umAnoAtras, // Vencido há 1 ano
        status: EquipmentStatus.VENCIDO,
      },
    }),
  ]);

  console.log(`✅ ${equipamentos.length} equipamentos criados`);

  console.log('✨ Seed concluído com sucesso!');
  console.log(`📊 Resumo:`);
  console.log(`   - ${setores.length} setores`);
  console.log(`   - ${tipos.length} tipos de equipamento`);
  console.log(`   - ${regras.length} regras de calibração`);
  console.log(`   - ${equipamentos.length} equipamentos`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
