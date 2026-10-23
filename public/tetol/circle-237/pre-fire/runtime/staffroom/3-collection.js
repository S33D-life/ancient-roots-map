// Preserved from the TETOL Staff Room interior (5eaf7c1e-2b0d-4c3a-9f61-7a1d3b8e0c42); see scripts/tetol-staffroom.mjs.

/* STAFF DATA → COLLECTION ADAPTER  (experiment 0.1 — not canonical)
   Everything here is lifted from sources; nothing is inferred.
   - species codes + names, circle names ........ Drive: staffContract.ts (SPECIES_MAP, CIRCLES)
   - spiral order, origin measurements .......... Drive: staffRoomData.ts (SPIRAL_ORDER, SPIRAL_MEASUREMENTS)
   - staffNumber 13 = Origin Spiral ............. repo: contracts/contracts/StaffNFT.sol
   - photographs ................................ Drive: /staffs  ({code}.jpeg, {species}-c{n}-s{m}.jpeg)
   - later circles (beyond the 144) ............. Notion: Staff Library › Oak 48 / Yew 48 databases (Oak-C4S1…S12, YEW-C4S1…S12)
   - in-house counts per species ................ Notion: Staff Library page headings ("Hornbeam 13", "Box 10 (2)" …)
   Output vocabulary is generic (node / origin / cluster / member) so the seed
   renderer never learns the word "staff". */
(function () {
  const NAMES = { GOA:'Goat Willow', PLUM:'Plum', BEE:'Beech', RHOD:'Rhododendron', CHERRY:'Cherry', ROW:'Rowan',
    PINE:'Pine', BOX:'Box', OAK:'English Oak', PRIVET:'Privet', WILLOW:'Weeping Willow', SYC:'Sycamore', HAZ:'Hazel',
    HORN:'Hornbeam', YEW:'Ancient Yew', ASH:'Common Ash', HOL:'Holly', SWE:'Sweet Chestnut', APP:'Apple', IVY:'Ivy',
    ELD:'Elder', HAW:'Hawthorn', PLA:'Plane', BUCK:'Buckthorn', BIR:'Silver Birch', ROSE:'Rose', BUD:'Buddleia',
    CRAB:'Crab Apple', DAWN:'Dawn Redwood', HORS:'Horse Chestnut', JAPA:'Japanese Maple', MED:'Medlar', PEAR:'Pear',
    SLOE:'Blackthorn', WITC:'Witch Hazel', ALD:'Alder' };
  const SPIRAL_ORDER = ['YEW','OAK','HORN','HOL','HAW','PLA','ASH','GOA','ELD','BEE','APP','ROSE','CHERRY','ROW','ALD',
    'SYC','BIR','HAZ','SWE','IVY','PLUM','PINE','RHOD','PRIVET','WILLOW','BOX','BUCK','DAWN','BUD','CRAB','WITC','PEAR',
    'JAPA','SLOE','MED','HORS'];
  const MEASURE = { GOA:['119 cm','292 g'], PLUM:['103 cm','505 g'], BEE:['128 cm','1,315 g'], RHOD:['116 cm','560 g'],
    CHERRY:['94 cm','433 g'], ROW:['138 cm','911 g'], PINE:['159 cm','1,337 g'], BOX:['161 cm','1,332 g'], OAK:['119 cm','550 g'],
    PRIVET:['104 cm','666 g'], WILLOW:['118 cm','646 g'], SYC:['124 cm','613 g'], HAZ:['99 cm','734 g'], HORN:['133 cm','990 g'],
    YEW:['161 cm','1,252 g'], ASH:['131 cm','816 g'], HOL:['157 cm','600 g'], SWE:['98 cm','1,210 g'], APP:['114 cm','1,000 g'],
    IVY:['94 cm','901 g'], ELD:['127 cm','505 g'], HAW:['102 cm','603 g'], PLA:['152 cm','1,844 g'], BUCK:['161 cm','663 g'],
    BIR:['144 cm','888 g'], ROSE:['122 cm','599 g'], BUD:['115 cm','393 g'], CRAB:['119 cm','644 g'], DAWN:['142 cm','500 g'],
    HORS:['101 cm','1,333 g'], JAPA:['103 cm','1,100 g'], MED:['109 cm','2,525 g'], PEAR:['137 cm','848 g'], SLOE:['177 cm','1,844 g'],
    WITC:['84 cm','433 g'], ALD:['93 cm','955 g'] };
  /* filename stems used in Drive /staffs (staffRoomData.ts DISPLAY_CODES) */
  const STEM = { CHERRY:'cher', PRIVET:'priv', WILLOW:'wil' };
  const CIRCLES = { OAK:[1,2,3], YEW:[1,2,3], ASH:[1], BEE:[1], HOL:[1] };
  const CIRCLE_NAME = (code, n, total) => {
    const base = { OAK:'Oak', YEW:'Yew', ASH:'Ash', BEE:'Beech', HOL:'Holly' }[code];
    return total > 1 ? `${base} Circle ${n}` : `${base} Circle`;
  };
  /* Drive file IDs, /staffs folder (1P3aW5a46HVP29fMocqYCejHso5Yj_zU2), inventoried 2026-09-23 */
  const P = {
    yew:'1skd7Sx0Ga854O0h9UH4n6Axj_u1SnTUC', syc:'1ldDZyVocnR2LWbbxtR6p5GWOa6WEk5pA', row:'1yC7lnCKvRcSRR2FUY9H6A37fWeBLNmI6',
    wil:'1YT6eiHobQX3Ys_O8m5rhsn64K_dX8xBZ', buck:'1kQaJKAKpuu8HOzQBrmjIaR9X-bCQzPob', priv:'1PQ_5eoZms6Sd47mpabnGpbmfkRrt3w9h',
    horn:'1TPVeg_FSGZcRP6E0JJaeI7JK4Kf-eTqA', witc:'1gIRxxjcdXIkSiqPsPTeGekeCpTY9R2kx', rhod:'1aO2WXqU8zl2zFn3sgJVK4623_V_vdkLq',
    med:'1GhUtkSeLDqOxV4g9mwOxTsGyP7w1NIU_', sloe:'1TS8B99tRMOJCbsR-2fWDVN2-L7C0lUkW', ivy:'1jG_Pqp7HtbQ29qsEXlU4mAwcTSKJfQrQ',
    goa:'1_wtS8WoNK_uSQ7iEl5yPGw7gAZ-YwRxV', bud:'1mo12ZcCeQolPPuGCmce0-wu0RLDaNs0l', app:'17tigmGwsuAT1YomUqiJzZrvCAjECoTLr',
    japa:'1_w9h9XiDM0skJEbpu5JlRuKYlpi0bf3A', box:'16vuQLtPuDCCapEecHkDFtS--6pmLQYTp', pla:'1Iy4f_kJt6u_CqER6idlX7ig0Ra2UDTha',
    dawn:'1Y49fs88ltbaCr9MAulKeI0W_Ty8YxuWo', eld:'1MVMFj5iTuJJPHEv7bIjIrU1VnV19uTj0', hors:'1FTH8-_96iNZEGygdTSVdrOcWKtZouapM',
    swe:'17adLkA2Yk2P6iD7hby4Qptg4t9wJyo7K', pine:'11AhcTj0NqfkFWgJ2D99Beb9JfU0y2ra6', oak:'1PlKdHQgL0DCA1Pa8VHSUV4v70zwhFJ56',
    rose:'12I59p24TlZghS0IAFOUrdHAG5ZVoNouQ', ald:'1UvK1K-_4nDCMqrMpo6TnG9bDsuFvGkQe', bee:'1i50gvj1RsmiTh6qmvj0esgMVU3qRcxy-',
    haw:'1JWkFypfTd3eMUidit3kgqbKQAwEbPBF0', plum:'1cWgIcr5NyKQ4wfSa2wBJs2sVve9UVi8h', pear:'1FhGpAk3XOkhASJZeNywsrfL7soUYHl_O',
    ash:'1vS7pEPbpAbDa7PlZammhUSO5ZI3ivS8l', haz:'1x9liOYqfVfO3NCIkJi7OmtgCLa76Qos7', bir:'1zysjGDRhGB6qw_VeQdGB4tOrzd6oDzu1',
    hol:'116Zhxc-8uNt5Ha7bnCxrnO1CQ77QQU4L', crab:'1kbemMQkORiob8GO0G_9G-CfJPtwfZ3QZ', cher:'1D_B4LcGm6v8dp9zi0tId2dFOfE-XIdI3',
    'ash-c1-s1':'1YtgCpm9uoZORC8LxgT-ClNCpkhAaGEuo','ash-c1-s2':'19CaLn9RWai-bDpGX9hIHkjQrjGK9fFHn','ash-c1-s3':'16zLAwgNd4netNz9-sS7wKGIU9lePsIIK',
    'ash-c1-s4':'1OaxqWEnRnrplfgD2RKa0YpHBx3fSCSBR','ash-c1-s5':'1U6dzFiGvf_1yjqpxqXnMAPT7f6PSeIH7','ash-c1-s6':'19a8otoPxe1lBqyfvqXA6BBukwaFH0M40',
    'ash-c1-s7':'1NoJzFegJ9EZTaJt5bIimlZg7MjgWLMvl','ash-c1-s8':'1esbNxbh67Io-3-vv94zA_HWG3-lVubqC','ash-c1-s9':'1NupFpBMVy2OnbaifVo8Rdfk_i0EoOHuX',
    'ash-c1-s10':'1CaT_8Jk-C50MAyS8f3O_-SlXttbMihmj','ash-c1-s11':'1sqMS-ub5rneZ-V7eveAKzYE4W2Wn9nRr','ash-c1-s12':'1-hK0u0tBT6SEgDLVAeNXAK1UZQR9lzYr',
    'bee-c1-s1':'1cZbv8dbxuCkty2TYs4Z8fWZcYehb6JqK','bee-c1-s2':'1SGHOYRUMqdlzfiT2qC7zw_u5JLqO5wn6','bee-c1-s3':'1CEhudcQoY7XT1ftMDgfdYK1v9DquKcyn',
    'bee-c1-s4':'1fbr5RbcAJPbuwe-bCQHdvIr-d4rAtxR8','bee-c1-s5':'1V7vYymJsoA2VhxbfAVQH6eGrnfakFbrl','bee-c1-s6':'1TY4stzhL9xeGzN_57y5xC44Uq2I4xfxp',
    'bee-c1-s7':'1CjIJ6FEEwWg_un9685jQ7JGBpLx_qOC0','bee-c1-s8':'1dUaQhD2GT4F2cySBO4ONNl_g20_qo4xv','bee-c1-s9':'1TolYGDlxakF18piLx2J2q0fFmfxZ_SSn',
    'bee-c1-s10':'1ei40Jh-Tq6KJwz6mZtUNzhDP301rAlpw','bee-c1-s11':'1KZCwylkq1UpX4ko7BmH8a66oQrODvq3q','bee-c1-s12':'18xy5HomYRDeWvw3yQmNoOHmxFglrJDpX',
    'hol-c1-s1':'10N5batFiLL4hIYKphhIWvHsd1nyKaGb4','hol-c1-s2':'1NNWvdMYOjGaGWa5BbbgYtK7R-v21keAK','hol-c1-s3':'1_yDjgXx3dFFu_LXLan6X3grw_Z1nv5Z0',
    'hol-c1-s4':'1Tp8CN0RXhgb1jIBc4pJ_OM1H_9JS7sov','hol-c1-s5':'1dHDxBkaI6lvVlDRfLmR3WFogEjQcNQ6c','hol-c1-s6':'1XnyDrS2fGE6hlfyAP6OPljbtizVax4g-',
    'hol-c1-s7':'1hpllT6LCr47zNRxFn2ZMhOCg2d1p4de8','hol-c1-s8':'1IoZDfKLC2QD7ErS9rgHfEKe2hbRhoiza','hol-c1-s9':'1bDKCbca6bg02PUD722cBCXlPukEGddyN',
    'hol-c1-s10':'1ns8eVws_semRo4Y2xhhvYY4fR53vDZL1','hol-c1-s11':'1G41diWcNKSJ-7033Lqg8GfM2jfKb8jgi','hol-c1-s12':'1omhC3TzLRMQATtL63OEZlpiB0loDcQpt',
    'oak-c1-s1':'10yD93p7hZMB3wRHIIA1ubX4objjZWjGu','oak-c1-s2':'1nOOFLbo7XZeXlp--x0gjIXGu2srPPsfh','oak-c1-s3':'1AF0jnDFIYkwYP1YaTqCILkKUEI3KytJk',
    'oak-c1-s4':'1XWII4pzp54nQcSLztoCx-q8hudfS3VeJ','oak-c1-s5':'16gJ3howN4j1m4xy5IS3ZqLExEVmF5sCp','oak-c1-s6':'1zAfNmeQ3Y8YeGTXQKzMuZFuEAskJuN0G',
    'oak-c1-s7':'1C44sOllNZBx_jnahZQ7LJvk0Ew7Eu27C','oak-c1-s8':'1xtiB1AVLPkz4fsksBdOOYaqb4EamQDHJ','oak-c1-s9':'1AKkLfSLBHhfQxirf-IQpK-47brw1ASne',
    'oak-c1-s10':'1uAgI59k1gyrUkAIWvKCfD353SIuBPH9j','oak-c1-s11':'1OXcXR6Kl7oIIDQSA5-ckMPF_p0peUuEU','oak-c1-s12':'1tUQrmMjoleqcxiy_vksWjanmiDZ-WIh_',
    'oak-c2-s1':'1xa5K4j3NNtoZMbdvNpxu4VoI3t7ojrs9','oak-c2-s2':'1qixTbj3yqesW4GsuDk-wvW7mR9BvtUC6','oak-c2-s3':'1Bf4XuNMyK7-pi2BmkSXqoOvcLT6O_MJ4',
    'oak-c2-s4':'1TXM4M-SizB43zNbzSVQZPExk8sSgKtl7','oak-c2-s5':'1_4DEzVUqyc2GzYN8sDJg5VYGbsI5CThE','oak-c2-s6':'1WmoV7QWwM1GiWF7sd4H9ixW5LVoi0bIk',
    'oak-c2-s7':'1i6Qx2uSoHLU9OjAvOLyOwqqvx-_E0XnO','oak-c2-s8':'1dozedyaLy7YwcMBkSxUVz2ca3QrM5Jd7','oak-c2-s9':'1K8K7vbMXRJxod4a6N5B1926ARlbzHu37',
    'oak-c2-s10':'1MdPs250CpjmHGSwI8EEdqT3Q6u54B6pg','oak-c2-s11':'1-aU-dhwXqXt8goongIFjS4qdVtXpOb9J','oak-c2-s12':'1T28Hn3oSOduJCgLQsxY7kZAYO_Bv9fdl',
    'oak-c3-s1':'1AePpG8x2pN5AvaN42sIeHm2QcI7b6RTL','oak-c3-s2':'1VEtSG0KyipewKBYl2WwrwUCgETcRV6nW','oak-c3-s3':'1wOUm-X3bGtZ5IpRyD8N1DXRxeEbDcQhM',
    'oak-c3-s4':'1f57PbCrsPeOELBiBQMIL9P5xD8LNoff2','oak-c3-s5':'187e1BjR9ruK7ys69XhA5YQ8wv9vkU0Wp','oak-c3-s6':'1JMSn7Y1hcmMsnLAIaNuYr1LhMjQIVMe2',
    'oak-c3-s7':'1pYkPXvU31DBl-a_vqU-GSEqByWas_e_W','oak-c3-s8':'1TM9R7qxIxwdU8jHEAI-4vJH-dPy6CV8K','oak-c3-s9':'1apkz-pc_m6NccILEjkpxMECHt5gfewlY',
    'oak-c3-s10':'1hHWplMtwSUPaRyns6ddlDe0ZH3H38XTr','oak-c3-s11':'11gUaKDHiSV4OpXlEzrlVGZdDu1UFwStG','oak-c3-s12':'16IQygjuTTXVpmpmFt1PR39433737deF2',
    'yew-c1-s1':'1-6Q8rch-FUwfA97BQ2y8Jhf4BVS-RiLf','yew-c1-s2':'1NDWDQCFDh9zxLLx4EaHW5PHHwSIlOIkc','yew-c1-s3':'1p9RccAyRoSt6LMI2RksljxeGhSB3WHjr',
    'yew-c1-s4':'1VMtWL4PRWe7XlzqwogxDE5pUbyWtPCd4','yew-c1-s5':'1-KkJiZqQUjAbWsmH4s7Yh35donJHjmSK','yew-c1-s6':'1DsYWrC9RxmGtt4g-LUZ_FaH9QNNrzIfG',
    'yew-c1-s7':'1DcBqEWTpSSm3qwLPM7N0DkXWsKYkcZUn','yew-c1-s8':'1vr4dYcKcnWykFbnwVtfe1z2AiLe47Nxy','yew-c1-s9':'1GdKLFslCLHH6UWdMQllvnjzv8wvBi_0H',
    'yew-c1-s10':'1Qy8TAYzLVRZW7ktXkKHr5CaywzGF0ibt','yew-c1-s11':'1vx5iCGgRrZZnCgEvUCgW9oJzD-Wu-fOd','yew-c1-s12':'1o-E4qNZD7T5yJIE2345f3gjt66aMa89V',
    'yew-c2-s1':'14ycD7OLwljSwucL4O09MYJofdoVNHH0l','yew-c2-s2':'1YMTGQLznHblAaXP0pIKHI8_2z75xoCWi','yew-c2-s3':'139DedNcIt4k-su54rHcuXWX3UvUInKB2',
    'yew-c2-s4':'1gq9WZcJjTKI7zt_ju7cQ5-jwda6Y3RSg','yew-c2-s5':'1edmDtc92yVXiB-bBM4N0bJUX7n1tbWOt','yew-c2-s6':'11q495VZb5jkWdqHdpCZIqPIpmZZMumJL',
    'yew-c2-s7':'1DkEU_T81OHcZsPrQtgvL5a-bVr-hVDzY','yew-c2-s8':'1CGpxoUsgDnwYgnrGZJW9zcvcsqVww9ua','yew-c2-s9':'1TS011GWA0KP4pEt2eJr-e6JevQxBpukN',
    'yew-c2-s10':'1vnBjWuzAwvvHRz0dA9XofQSKoE5mxLaa','yew-c2-s11':'1yUBL2iKMEkPEXahQ3ucQMzna8lXRjbuJ','yew-c2-s12':'1paPwxPrAI-8mI9ZRK4x1bVpT6CbVVtVi',
    'yew-c3-s1':'1C4ZCETpDYCA3Kmsl-gCdVnyk8iCxMt6D','yew-c3-s2':'1NycEYgfXRHorMTQE_j9C3X7NbvKWNUiH','yew-c3-s3':'1_Tq570vfoFtqMVZftkz0LHsSkz7is6sX',
    'yew-c3-s4':'1LMmUlElBPJ6wRAktB718TVc3-KNKBim0','yew-c3-s5':'1wpvKqDBlzjAzORryYsXFYVY6KWUSc463','yew-c3-s6':'1HonbtXF-UhPEie5AkcWbIUdFaPzYLFCa',
    'yew-c3-s7':'1W9cyIKWNhhMr9bU2BaSH-HDhHDhPSYQ3','yew-c3-s8':'1kV0eT1GhjVtqgRexejJKlVsxy_GhgKym','yew-c3-s9':'1ZDGMWh2EWJP6_5Ua83DOjDEtQTbFcF3H',
    'yew-c3-s10':'1ZUxILDTtSAyYPTZivm8hn2oAZAf34l4u','yew-c3-s11':'1R0aawv8X7_BLPWw4xbIAcAnVtMNr33GR','yew-c3-s12':'1TJEnvoTLnlFPZN16DtLLi-7wxCbNOo-a',
  };
  const photo = (stem) => {
    const id = P[stem];
    return { where: 'Drive',
      file: stem + '.jpeg',
      small: id ? `https://drive.google.com/thumbnail?id=${id}&sz=w200` : null,
      large: id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : null,
      href: id ? `https://drive.google.com/file/d/${id}/view` : null,
    };
  };
  const NOT_RECORDED = ['source tree', 'maker', 'date made', 'story', 'steward'];
  /* Circles present in Notion beyond the founding circle structure (staffContract.ts gives Oak and Yew three circles each).
     Lineage is NOT stated in these records: held as unresolved, never inferred from circle number. Values: Notion page ids. */
  const LATER = {
    OAK: { n: 4, db: 'Oak 48', pages: ['2f115b58480d8012b80be5528f5850fc','2f115b58480d807bbaa3e059ab3b3f5a','2f115b58480d801b9febc6813b95b7cf',
      '2f115b58480d80cbb2ede74e9bb8f313','2f115b58480d807e8337f5b99c274461','2f115b58480d805889b0eac09a527407','2f115b58480d800981c8f884ad0fe3f8',
      '2f115b58480d8062bb0efd34fd5338b5','2f115b58480d809f8374c227df38e73f','2f115b58480d80738d65d6112a2fd512','2f115b58480d80559078dacacc6d2b5c',
      '2f115b58480d80dbb6d2de8d4a930791'], measured: { 1: ['95 cm', '699 g'] } },
    YEW: { n: 4, db: 'Yew 48', pages: ['2a815b58480d81c79e10f260cc01be2b','2a815b58480d815f8865ff557b9b8a62','2a815b58480d8199bfa7f56b51ffc059',
      '2a815b58480d8164b279e5b4ce72778f','2a815b58480d816692c9cb6eeff4fd5f','2a815b58480d81ea8b72d6c0b5977692','2a815b58480d81818989cd5ad9818c79',
      '2a815b58480d81c9afd3de2f45b81bea','2a815b58480d81219d43e82908a8628f','2a815b58480d81c0bca2f10f78fc1372','2a815b58480d819091f9e179cfeb32db',
      '2a815b58480d814aa4c7c7b75519166d'], measured: {} },
  };
  /* "In house" counts as written on the Notion Staff Library page. Counts only: no individual records behind most of them. */
  const IN_HOUSE = { YEW:'48', OAK:'48', BEE:'12', ASH:'12', HOL:'12', HORN:'13', BOX:'10 (2)', HAW:'8', ROSE:'7 (1)', SWE:'8 (1)', APP:'5',
    HAZ:'4', ROW:'3', WILLOW:'3', PRIVET:'3', RHOD:'2', IVY:'2', PLUM:'2', ELD:'1', SYC:'1', PLA:'1', PINE:'1', CHERRY:'listed, no count' };
  const FOUNDING = ['Lineage', 'Confirmed founding · Founding 144'];

  const nodes = [], items = {};
  SPIRAL_ORDER.forEach((code, order) => {
    const stem = STEM[code] || code.toLowerCase();
    const originId = code + '-O';
    const m = MEASURE[code];
    items[originId] = {
      id: originId, type: 'staff', status: 'founding', cohort: 'founding_144', lineage: 'founding', confidence: 'sourced',
      lineageBasis: 'Staff 13 of each species is the Origin Spiral (StaffNFT.sol); all 36 sit in the founding structure of staffContract.ts.', nodeId: code, clusterId: null, role: 'origin', index: 13,
      provenance: ['Species name: staffContract.ts (SPECIES_MAP)', 'Length and weight: staffRoomData.ts (SPIRAL_MEASUREMENTS)',
        'Staff number 13 = Origin Spiral: StaffNFT.sol', `Photograph: Drive /staffs/${stem}.jpeg, the image staffRoomData.ts uses for this staff`],
      kicker: 'Originating staff · the 13th', title: NAMES[code], code: `${code}-C0S13`,
      photo: photo(stem),
      fields: [['Species', NAMES[code]], FOUNDING, ['Place on the spiral', `${order + 1} of 36`], ['Length', m[0]], ['Weight', m[1]],
        ...(IN_HOUSE[code] ? [['In house (Notion count)', IN_HOUSE[code]]] : [])],
      gaps: NOT_RECORDED,
    };
    const circles = (CIRCLES[code] || []).map((n, ci, arr) => {
      const cid = `${code}-C${n}`;
      const memberIds = [];
      for (let s = 1; s <= 12; s++) {
        const id = `${cid}S${s}`;
        items[id] = {
          id, type: 'staff', status: 'founding', cohort: 'founding_144', lineage: 'founding', confidence: 'sourced', nodeId: code, clusterId: cid,
          lineageBasis: 'Listed in the founding circle structure of staffContract.ts (CIRCLES), which accounts for the 144.', role: 'member', index: s,
          provenance: ['Circle structure: staffContract.ts (CIRCLES)',
            `Photograph: Drive /staffs/${stem}-c${n}-s${s}.jpeg, matched by the species-circle-staff filename pattern in staffRoomData.ts`],
          kicker: `${CIRCLE_NAME(code, n, arr.length)} · staff ${s} of 12`, title: NAMES[code], code: id,
          photo: photo(`${stem}-c${n}-s${s}`),
          fields: [['Species', NAMES[code]], FOUNDING, ['Circle', CIRCLE_NAME(code, n, arr.length)], ['Staff', `${s} of 12`]],
          gaps: NOT_RECORDED,
        };
        memberIds.push(id);
      }
      return { id: cid, label: CIRCLE_NAME(code, n, arr.length), cohort: 'founding_144', memberIds };
    });
    const later = LATER[code];
    if (later) {
      const cid = `${code}-C${later.n}`, memberIds = [], label = CIRCLE_NAME(code, later.n, 2);
      later.pages.forEach((pg, si) => {
        const s = si + 1, id = `${cid}S${s}`, href = `https://www.notion.so/${pg}`, ms = later.measured[s];
        items[id] = {
          id, type: 'staff', status: 'unresolved', cohort: 'unresolved', lineage: 'unresolved', confidence: 'record exists · lineage not stated', nodeId: code, clusterId: cid, role: 'member', index: s,
          lineageBasis: `Recorded in Notion (${later.db}). The record does not say whether this staff is founding or later. staffContract.ts lists three circles for ${NAMES[code]}; a fourth circle sits outside that structure, but nothing yet confirms it as later.`,
          provenance: [`Record: Notion › Staff Library › ${later.db} › ${code === 'OAK' ? 'Oak' : 'YEW'}-C${later.n}S${s}`,
            'Lineage: not stated in the record, so unresolved. Circle position and lineage are held separately.',
            ...(ms ? ['Length and weight: the Notion record'] : [])],
          kicker: `${label} · staff ${s} of 12`, title: NAMES[code], code: id,
          photo: { state: 'in-source', file: 'Photo in source — not yet ingested', small: null, large: null, href, where: 'Notion' },
          fields: [['Species', NAMES[code]], ['Lineage', 'Unresolved'], ['Circle', label], ['Staff', `${s} of 12`],
            ...(ms ? [['Length', ms[0]], ['Weight', ms[1]]] : [])],
          gaps: ms ? NOT_RECORDED : ['length and weight (in Notion, not yet read)', ...NOT_RECORDED],
        };
        memberIds.push(id);
      });
      circles.push({ id: cid, label, cohort: 'unresolved', memberIds });
    }
    const count = 1 + circles.reduce((s, c) => s + c.memberIds.length, 0);
    nodes.push({ id: code, label: NAMES[code], code, order, originId, clusters: circles, inHouse: IN_HOUSE[code] || null,
      count, metrics: { staffCount: count, founding: 1 + circles.filter((c) => c.cohort === 'founding_144').length * 12 } });
  });

  window.SeedCollection = {
    title: 'Staff Library',
    chapter: { label: 'Staff Library', count: Object.keys(items).length, nodeCount: nodes.length,
      founding: Object.values(items).filter((i) => i.cohort === 'founding_144').length,
      later: Object.values(items).filter((i) => i.lineage === 'later').length,
      unresolved: Object.values(items).filter((i) => i.lineage === 'unresolved').length },
    nodes, items,
    vocabulary: { node: 'species', origin: 'originating staff', cluster: 'circle', member: 'staff' },
    continues: true,
  };
})();

