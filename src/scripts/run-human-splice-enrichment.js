const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 1. Resolve Supabase credentials from .env.local
const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase") || supabaseAnonKey.includes("your_supabase")) {
  console.error("❌ Supabase credentials not configured in .env.local yet.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Predefined high-quality profiles for the top target candidates
const predefinedProfiles = {
  "sydney-funnel-web-spider": {
    trait_name: "Độc Tố Thần Kinh Delta-Atracotoxin Chậm Bất Hoạt Kênh Natri NaV1.6 và Nanh Chelicerae Song Song Lực Ghim Đâm",
    title: "Người Lai Nhện Lưới Phễu Sydney - Kẻ Hủy Diệt Xung Thần Kinh",
    slug: "sydney-funnel-web-spider-human-splice",
    sci_fi_hype: "Tích hợp nanh độc chelicerae song song chĩa dọc của Nhện Lưới Phễu Sydney dưới dạng cặp nanh sừng chitin ẩn ở ngón tay người lai, đi kèm tuyến nọc delta-atracotoxin tinh chế. Khi đâm sâu vào mục tiêu, chất độc lập tức liên kết chọn lọc và phong tỏa chậm quá trình đóng kênh natri nhạy cảm điện thế NaV1.6. Xung thần kinh liên tục phóng đi không ngừng nghỉ, gây co giật cơ tột cùng, huyết áp tăng vọt và suy hô hấp cấp cho đối phương chỉ trong vòng 10 giây.",
    scientific_reality: "Cơ chế sinh học: Độc tố Delta-atracotoxin là peptide gồm 42 axit béo liên kết disulfide bền vững, tác động chọn lọc cao vào linh trưởng. Tế bào thần kinh của người lai được bảo vệ nhờ lớp lipid kép bổ sung glycoprotein mang thụ thể biến đổi kháng độc tố. Cặp nanh chitin ngón tay được gia cố mật độ khoáng calcium carbonate, kéo dài dọc ngón trỏ và ngón giữa, chịu lực ghim bổ thẳng đứng được dẫn truyền xung cơ khép hàm (adductor muscles) tái tạo ở bả vai.",
    spliced_stats: {
      strength: 88,
      durability: 85,
      speed: 90,
      weaponry: 96,
      special: 86,
      lethality: 98
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 850,
      stinger_length_cm: 6.5,
      delta_atracotoxin_concentration_mg_ml: 1.8,
      formulas: [
        {
          name: "Áp lực ghim đâm của nanh độc Chelicerae (Nanh Song Song)",
          equation: "P_stinger = F_arm / A_tip",
          result: "3.2 kN"
        },
        {
          name: "Hệ số bất hoạt kênh Natri do Delta-Atracotoxin (Sodium Channel Inactivation Delay)",
          equation: "tau_delay = tau_0 * (1 + C_venom / K_d)",
          result: "12.5 times slower (gây kích thích thần kinh liên tục)"
        }
      ]
    },
    summary: "Lai ghép gen Nhện Lưới Phễu Sydney tích hợp nanh độc chelicerae song song lực ghim đâm mạnh mẽ và nọc độc delta-atracotoxin trì hoãn đóng kênh natri, làm tê liệt hệ thần kinh vận động đối thủ."
  },
  "trapdoor-spider": {
    trait_name: "Hệ Thống Răng Đào Đất Rastellum Chitin Hóa và Phản Xạ Bất Ngờ Tốc Độ Cực Hạn dưới 0.03 Giây",
    title: "Người Lai Nhện Cửa Sập - Bóng Ma Phục Kích",
    slug: "trapdoor-spider-human-splice",
    sci_fi_hype: "Cấy ghép hàng gai sừng (rastellum) đào bới siêu cứng dọc xương cẳng tay và các ngón tay, đồng thời đồng hóa phản xạ săn mồi chớp nhoáng dưới 0.03 giây của Nhện Cửa Sập. Người lai có thể ẩn mình tuyệt đối dưới lòng đất ẩm hoặc ngụy trang cửa sập bằng tơ và rêu, định vị mục tiêu chính xác qua hệ thống tơ cảm ứng rung động Rayleigh địa chấn, sau đó bật phát lực cơ học cực đại tóm gọn và kéo kẻ địch xuống hố chỉ trong một chớp mắt.",
    scientific_reality: "Cơ chế cơ sinh học: Phản xạ siêu tốc dưới 30 mili-giây đòi hỏi synapse myelin hóa cực dày kết nối dây thần kinh cảm thụ chày trực tiếp với thùy trán và các bó cơ đùi chi dưới, bỏ qua hầu hết các trạm trung chuyển trung ương thông thường. Gai rastellum sừng hóa chứa chitin liên kết chéo collagen đặc biệt, chịu được mài mòn áp lực cao khi đào đất cứng. Áp suất dịch cơ thể (hemolymph pressure) được dồn nén tức thì lên chi dưới nhờ van cơ tim đóng ngắt cholinergic.",
    spliced_stats: {
      strength: 86,
      durability: 90,
      speed: 95,
      weaponry: 88,
      special: 92,
      lethality: 93
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 2800,
      ambush_time_ms: 28,
      seismic_sensor_range_m: 15,
      formulas: [
        {
          name: "Gia tốc bứt phá phục kích (Ambush Acceleration)",
          equation: "a = v_takeoff / t_ambush",
          result: "480 m/s² (tầm 49 G)"
        },
        {
          name: "Độ căng bề mặt cửa sập tơ đất (Door Edge Tensile Strength)",
          equation: "sigma = F_hold / (pi * d_door * t_door)",
          result: "4.2 MPa"
        }
      ]
    },
    summary: "Lai ghép gen Nhện Cửa Sập cung cấp gai sừng rastellum đào hang kiên cố và phản xạ bộc phát kéo mồi < 0.03 giây, mang đến khả năng ngụy trang phục kích cận chiến vô song."
  },
  "velvet-ant": {
    trait_name: "Khung Xương Ngoài Chitin Sclerotin Mái Vòm Chịu Lực Ép Cực Hạn và Ngòi Châm Trượt Siêu Linh Hoạt",
    title: "Người Lai Kiến Nhung Đỏ - Chiến Binh Thép Bất Hoại",
    slug: "velvet-ant-human-splice",
    sci_fi_hype: "Cường hóa lớp da hạ bì thành bộ giáp xương ngoài chitin-sclerotin mái vòm cầu chịu lực của Kiến Nhung Đỏ, có khả năng kháng cự tải trọng tĩnh và động gấp hàng nghìn lần trọng lượng cơ thể (chịu lực nghiền nát từ gót chân người khổng lồ hoặc đạn bắn). Đồng thời tích hợp chiếc ngòi châm chitin siêu dài (bằng 50% chiều dài cơ thể lai) ẩn sau xương cụt, vô cùng linh hoạt, phun axit dasymutillic và peptit kích thích đau đớn cấp độ 4 (Schmidt Pain Index) tột cùng gây sốc nhiệt ngay lập tức.",
    scientific_reality: "Cơ chế gia cường sinh học: Lớp giáp sừng bao gồm các lớp chitin đan chéo đa hướng kết dính bằng protein resilin dẻo chống mỏi cơ học, liên kết chéo sclerotin hóa cao độ. Cấu trúc mái vòm phân tán ứng suất cơ học dọc theo khung xương chậu và cột sống. Tuyến độc chứa peptide pH trung tính Dasymutillic acid bền nhiệt, không biến tính ở 50°C, kích hoạt trực tiếp receptor cảm giác đau TRPV1 mà không phá hủy tế bào diện rộng để tối ưu khả năng xua đuổi tự vệ.",
    spliced_stats: {
      strength: 90,
      durability: 99,
      speed: 80,
      weaponry: 92,
      special: 90,
      lethality: 88
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 4800,
      stinger_length_cm: 45,
      max_compressive_load_n: 290000,
      formulas: [
        {
          name: "Lực ép tĩnh giới hạn của giáp sườn mái vòm (Dome Exoskeleton Compression Limit)",
          equation: "F_comp = C_shape * E_sclerotin * (t_shell² / R_dome)",
          result: "290 kN"
        },
        {
          name: "Chỉ số đau đớn Schmidt thần kinh (Neurogenic Pain Index Rate)",
          equation: "I_pain = C_peptide * (r_agonist / K_trpv1)",
          result: "4.0 (cấp độ đau đớn dữ dội nhất)"
        }
      ]
    },
    summary: "Sở hữu bộ giáp chitin-sclerotin mái vòm triệt tiêu 98% lực nén và ngòi châm dài linh hoạt chứa peptide gây đau tột cùng, biến người lai thành một cỗ xe tăng phòng ngự bất hoại tự nhiên."
  },
  "jewel-wasp": {
    trait_name: "Hệ Thống Ngòi Châm Cảm Biến Xúc Giác và Độc Tố Phong Bế Neuron Octopamine",
    title: "Người Lai Tò Vò Ngọc Lục Bảo - Kẻ Thao Túng Tâm Thần",
    slug: "jewel-wasp-human-splice",
    sci_fi_hype: "Tích hợp ngòi châm sinh học chứa cảm biến xúc giác cơ học hình vòm (campaniform sensilla) vào đầu ngón tay người lai, kết hợp tuyến nọc độc chuyên biệt có khả năng phong tỏa neuron octopaminergic của đối thủ. Người lai có thể châm chính xác vào các hạch thần kinh vận động trung khu của mục tiêu, triệt tiêu 100% ý chí phản kháng và khả năng tự chủ, biến đối phương thành một 'con rối sống' di chuyển theo mệnh lệnh trực tiếp mà không cần dùng vũ lực cưỡng chế.",
    scientific_reality: "Cơ chế phẫu thuật thần kinh sinh học: Ngòi châm ngón tay chứa mạng lưới sợi thần kinh xúc giác liên kết chéo với màng myelin dẫn truyền xung nhanh. Nọc độc chứa hỗn hợp peptide làm giảm dòng ion canxi nhạy cảm điện thế tại hạch trung khu và ngăn chặn thụ thể octopamine. Để tránh ngộ độc chéo, hệ thần kinh của người lai được bọc lớp màng lipoprotein kháng độc tố octopaminergic đặc chế.",
    spliced_stats: {
      strength: 82,
      durability: 80,
      speed: 90,
      weaponry: 92,
      special: 98,
      lethality: 95
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 450,
      octopamine_block_ratio: 0.99,
      stinger_sensory_precision_microns: 5,
      formulas: [
        {
          name: "Tốc độ phong tỏa dẫn truyền thần kinh (Neurotransmission Block Rate)",
          equation: "t_block = C_venom * (K_diss / r_receptor)",
          result: "3.2 seconds"
        },
        {
          name: "Lực châm xuyên định vị chính xác (Stinger Insertion Force)",
          equation: "F_insert = P_axial / Area_tip",
          result: "1.25 kN"
        }
      ]
    },
    summary: "Lai ghép gen Tò Vò Ngọc Lục Bảo cung cấp ngòi châm xúc giác siêu chính xác và nọc độc phong tỏa neuron octopamine, cho phép kiểm soát hoàn toàn hệ vận động của đối thủ."
  },
  "namib-desert-beetle": {
    trait_name: "Lớp Giáp Biểu Bì Cassie-Baxter Ưa-Kỵ Nước Phân Tầng và Phản Xạ Bức Xạ UV",
    title: "Người Lai Bọ Sa Mạc Namib - Pháo Đài Tự Thu Sương Khí",
    slug: "namib-desert-beetle-human-splice",
    sci_fi_hype: "Cấy ghép lớp giáp elytra kitin phân tầng Cassie-Baxter của Bọ Sa Mạc Namib lên toàn bộ cơ thể người lai. Bề mặt giáp có cấu trúc sần chứa các hạt nano ưa nước phân bố xen kẽ với các rãnh kỵ nước tráng sáp hydrocarbon no mạch dài (pentacosane, heptacosane). Người lai có khả năng tự ngưng tụ hơi ẩm và sương mù trong không khí thành nước tinh khiết chảy trực tiếp vào hệ tuần hoàn lọc, đồng thời lớp sáp biểu bì phản xạ 99% bức xạ nhiệt mặt trời và tia UV có hại, cho phép sinh tồn vô hạn ở những vùng hoang mạc khắc nghiệt nhất.",
    scientific_reality: "Phân tích sinh học thích nghi: Cấu trúc Cassie-Baxter giảm lực cản lăn của giọt nước ngưng tụ về 0, nước tự trượt vào các kênh biểu bì dẫn tới màng lọc thẩm thấu ngược nhân tạo ở vùng ngực. Lớp sáp cutin gồm các este axit béo chuỗi dài ngăn chặn hoàn toàn hiện tượng mất nước qua biểu bì. Xương đùi và cẳng chân được kéo dài, tăng sinh mật độ mao mạch để giải nhiệt thụ động đối lưu không khí.",
    spliced_stats: {
      strength: 80,
      durability: 95,
      speed: 82,
      weaponry: 78,
      special: 96,
      lethality: 70
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 3800,
      water_collection_rate_l_hr: 0.85,
      uv_reflection_ratio: 0.99,
      formulas: [
        {
          name: "Hiệu suất thu sương bề mặt Cassie-Baxter (Fog Water Collection Efficiency)",
          equation: "eta = m_collected / (rho_fog * v_wind * A * t)",
          result: "0.88"
        },
        {
          name: "Hệ số truyền nhiệt qua biểu bì cách nhiệt (Thermal Transmittance)",
          equation: "U = k_chitin / d_elytra",
          result: "0.15 W/(m²·K)"
        }
      ]
    },
    summary: "Sử dụng lớp giáp Cassie-Baxter phân cực ẩm và chống bức xạ nhiệt giúp người lai tự cung cấp nước từ sương khí thụ động và kháng cự tuyệt đối thời tiết sa mạc."
  },
  "portia-jumping-spider": {
    trait_name: "Hệ Thần Kinh Popperian Lập Bản Đồ 3D và Cặp Mắt Ống Thấu Kính Viễn Vọng Kép",
    title: "Người Lai Nhện Nhảy Portia - Siêu Não Chiến Thuật Khắc Chế",
    slug: "portia-jumping-spider-human-splice",
    sci_fi_hype: "Tích hợp hệ thần kinh xử lý thông tin Popperian (thử và sai giả định trong đầu) và đôi mắt kép thấu kính viễn vọng của Nhện Nhảy Portia vào não bộ người lai. Người lai sở hữu khả năng thiết lập bản đồ không gian 3D thời gian thực cực kỳ trực quan, tính toán hàng trăm kịch bản đường vòng phục kích (spatial detouring) phức tạp trong tích tắc và bắt chước rung động tần số vật lý để bẫy kẻ thù. Cặp mắt chính có thấu kính viễn vọng kép phóng đại tiêu cự hẹp, quét phân tích mọi điểm yếu cơ học của mục tiêu từ xa.",
    scientific_reality: "Cơ chế tích hợp vỏ não: Hạch thần kinh trung ương được tăng cường các synapse polymer sinh học nối liền vỏ não thị giác với thùy trán, cho phép giả lập các phép thử-sai không gian trước khi vận động cơ xương. Cặp mắt chính dùng hệ thấu kính viễn vọng kép di động độc lập được điều khiển bởi cơ trơn siêu nhạy, cho phép hội tụ hình ảnh độ phân giải siêu cao tương đương loài thú săn mồi lớn mà không cần xoay đầu.",
    spliced_stats: {
      strength: 80,
      durability: 82,
      speed: 92,
      weaponry: 88,
      special: 99,
      lethality: 94
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 220,
      spatial_resolution_arcsec: 0.05,
      hydraulic_pressure_chi_psi: 320,
      formulas: [
        {
          name: "Độ phân giải thị giác lập thể mắt viễn vọng (Visual Angular Resolution)",
          equation: "theta = 1.22 * lambda / D_aperture",
          result: "0.05 arcseconds"
        },
        {
          name: "Lực bật nhảy bằng thủy lực chi dưới (Hydraulic Jump Force)",
          equation: "F_jump = P_hydraulic * Area_cylinder",
          result: "4.50 kN (nhảy xa gấp 8 lần chiều dài cơ thể)"
        }
      ]
    },
    summary: "Hệ thần kinh Popperian mô phỏng chiến thuật và mắt thấu kính viễn vọng kép mang lại khả năng phân tích chiến trận vô song, thiết lập cạm bẫy và phục kích bộc phát lực nhảy thủy lực cực đại."
  },
  "rove-beetle": {
    trait_name: "Độc Tố Paederin Phong Tỏa Tuyến Cơ và Phức Hợp Tế Bào Cộng Sinh Pseudomonas",
    title: "Người Lai Kiến Ba Khoang - Sát Thủ Hoại Tử Biểu Bì",
    slug: "rove-beetle-human-splice",
    sci_fi_hype: "Tích hợp phức hợp sinh sản độc chất Paederin và hệ cộng sinh Pseudomonas tinh khiết vào tế bào biểu bì người lai. Đòn đánh giải phóng Paederin mạnh gấp 15 lần nọc rắn hổ mang trực tiếp lên da mục tiêu, phá hủy cấu trúc protein, gây hoại tử biểu bì, phồng rộp bọng nước và bỏng rát đau đớn tột cùng mà không cần cắn hay châm đốt chủ động.",
    scientific_reality: "Cơ chế bài tiết hóa học: Paederin được tổng hợp qua enzyme của vi khuẩn Pseudomonas cộng sinh trú ngụ tại các tuyến mồ hôi biến đổi ở lòng bàn tay người lai. Tế bào biểu mô của người lai tự kháng độc tố nhờ đột biến cấu trúc ribosome ngăn Paederin gắn kết. Lớp màng lipid ngoài da dày giúp bảo vệ chống hấp thụ ngược độc tố.",
    spliced_stats: {
      strength: 80,
      durability: 85,
      speed: 84,
      weaponry: 95,
      special: 92,
      lethality: 96
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 650,
      paederin_concentration_mg_ml: 1.2,
      protein_synthesis_inhibition_ratio: 0.98,
      formulas: [
        {
          name: "Tỷ lệ hoại tử biểu bì do Paederin (Epidermal Necrosis Rate)",
          equation: "A_necrosis = C_paederin * t_exposure * K_necrosis",
          result: "15.0 cm² / microgram"
        },
        {
          name: "Thời gian bền nhiệt độc tố (Toxoid Thermal Half-Life)",
          equation: "t_half = ln(2) / k_decay",
          result: "24 hours at 100°C"
        }
      ]
    },
    summary: "Lai ghép gen Kiến Ba Khoang mang lại khả năng tiết độc tố hoại tử Paederin qua biểu bì lòng bàn tay, gây bỏng rát cực độ vô hiệu hóa đối thủ chạm phải."
  },
  "saharan-silver-ant": {
    trait_name: "Lớp Lông Biểu Bì Lăng Trụ Chitin Tản Nhiệt và Protein Sốc Nhiệt HSP70/90 Tốc Độ Cao",
    title: "Người Lai Kiến Bạc Sahara - Chiến Binh Nhiệt Đới Siêu Tốc",
    slug: "saharan-silver-ant-human-splice",
    sci_fi_hype: "Cấy lớp lông chitin cấu trúc lăng trụ tam giác đều phản xạ quang phổ của Kiến Bạc Sahara lên da người lai, kết hợp khả năng kích hoạt protein sốc nhiệt HSP70/90 cực hạn. Người lai có thể bứt tốc chạy đạt tốc độ kinh ngạc gấp 200 lần chiều dài cơ thể mỗi giây (tương đương 40-50 km/h ở người) trong môi trường nắng nóng lên tới 53.6°C mà không bị đông tụ albumin hay suy kiệt nhiệt.",
    scientific_reality: "Cơ chế tản nhiệt: Cấu trúc lăng trụ tam giác của lông phản xạ 96% tia hồng ngoại và bức xạ nhiệt trực tiếp từ ánh mặt trời, đồng thời giải phóng bức xạ hồng ngoại thụ động từ cơ thể chênh lệch nhiệt độ. Hệ tuần hoàn tăng cường sản sinh HSP70 và HSP90 để sửa chữa protein tế bào bị biến tính tức thời khi nhiệt độ cơ thể tiệm cận giới hạn.",
    spliced_stats: {
      strength: 80,
      durability: 92,
      speed: 98,
      weaponry: 75,
      special: 94,
      lethality: 75
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1420,
      running_speed_m_s: 12.5,
      max_body_temp_c: 53.6,
      formulas: [
        {
          name: "Công suất tản nhiệt bức xạ hồng ngoại (Infrared Thermal Dissipation)",
          equation: "P_rad = epsilon * sigma * A * (T_body^4 - T_ambient^4)",
          result: "420 W"
        },
        {
          name: "Tốc độ chạy bứt tốc cực đại (Sprint Velocity)",
          equation: "v = stride_frequency * stride_length",
          result: "12.5 m/s (45 km/h)"
        }
      ]
    },
    summary: "Tế bào lông lăng trụ phản xạ nhiệt và kích hoạt HSP protein giúp người lai bứt tốc cực đại dưới cái nóng thiêu đốt sa mạc mà không bị quá nhiệt nội môi."
  },
  "snake-mimic-caterpillar": {
    trait_name: "Hệ Thống Bơm Áp Lực Dịch Bạch Huyết Hemolymph Phình Lồng Ngực và Mô Phỏng Vân 3D",
    title: "Người Lai Sâu Bướm Giả Rắn - Bậc Thầy Đe Dọa Ảo Giác",
    slug: "snake-mimic-caterpillar-human-splice",
    sci_fi_hype: "Tích hợp cấu trúc điều khiển áp lực dịch cơ thể hemolymph và vân da bụng ngụy trang của Sâu Bướm Giả Rắn. Người lai có thể chủ động chuyển dịch dòng dịch cơ thể với áp lực cực nhanh dồn lên lồng ngực và cổ trong vòng 2 giây, làm phình to biến dạng vùng ngực thành hình dạng đầu rắn độc khổng lồ có đốm mắt 3D óng ánh phản quang khúc xạ ánh sáng, đi kèm tiếng rít khí quản phì phì dọa sợ và gây ảo giác hoảng loạn cực lớn cho đối thủ.",
    scientific_reality: "Cơ chế biến hình: Các khoang chứa dịch bạch huyết được bao bọc bởi các sợi cơ vân chéo co bóp dưới sự điều khiển của xung thần kinh cholinergic, đẩy 4.5 lít dịch lên phần ngực phía trước. Vân da bụng chứa các hạt tinh thể guanine khúc xạ ánh sáng tạo độ sâu 3D cho 'đôi mắt giả', đánh lừa thị giác kẻ địch.",
    spliced_stats: {
      strength: 80,
      durability: 85,
      speed: 82,
      weaponry: 80,
      special: 98,
      lethality: 84
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1100,
      inflation_time_seconds: 1.8,
      false_strike_velocity_m_s: 18.5,
      formulas: [
        {
          name: "Áp lực dịch bạch huyết dồn phình ngực (Hemolymph Inflation Pressure)",
          equation: "P = F_muscular / A_diaphragm",
          result: "180 kPa"
        },
        {
          name: "Tần số âm thanh phì phì đe dọa (Hissing Sound Frequency)",
          equation: "f = v_sound / (4 * L_spiracle)",
          result: "4200 Hz"
        }
      ]
    },
    summary: "Lai ghép gen Sâu Bướm Giả Rắn cung cấp cơ chế phình ngực bằng dịch cơ thể hemolymph tạo hình đầu rắn 3D sinh động kết hợp tiếng rít phì phì dọa sợ đối thủ."
  },
  "emperor-scorpion": {
    trait_name: "Hệ Thống Giáp Sừng Đen Phát Huỳnh Quang UV và Cường Hóa Lực Kẹp Ngón Tay",
    title: "Người Lai Bọ Cạp Hoàng Đế - Chiến Binh Dạ Quang Cường Lực",
    slug: "emperor-scorpion-human-splice",
    sci_fi_hype: "Cường hóa tế bào biểu bì và mô cơ xương ngón tay của người lai bằng mã di truyền của Bọ Cạp Hoàng Đế. Biểu bì ngoài hóa sừng thành các vảy sừng đen bóng chịu áp lực nén cao, có khả năng phát huỳnh quang màu xanh lục neon rực rỡ dưới tia UV để gây nhiễu thị giác đối phương trong bóng tối. Cặp cơ khép ngón tay cái và ngón trỏ được tái cấu trúc thành bó cơ kẹp khổng lồ, tạo ra lực khóa ép cơ học đủ lực bẻ gãy khớp tay đối thủ.",
    scientific_reality: "Phân tích phản ứng sinh học: Lớp sừng huỳnh quang chứa các hợp chất beta-carboline và tinh thể hữu cơ liên kết lipid, hấp thụ năng lượng kích thích tia cực tím để giải phóng photon màu xanh lục neon. Sự tăng sinh lực kẹp ngón tay đòi hỏi cấy ghép các sợi gân cơ resilin dẻo từ bọ cạp liên kết chéo với xương bàn tay, gia cố bằng lớp khoáng nano-calcium ở đầu ngón để chống nứt xương dưới lực bóp tĩnh.",
    spliced_stats: {
      strength: 90,
      durability: 88,
      speed: 78,
      weaponry: 86,
      special: 92,
      lethality: 85
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1650,
      pinch_force_n: 3500,
      uv_fluorescence_wavelength_nm: 510,
      formulas: [
        {
          name: "Lực kẹp tĩnh đầu ngón tay (Peak Pinch Force)",
          equation: "F_pinch = P_muscle * A_cross_section * mechanical_advantage",
          result: "3.50 kN (đủ nghiền nát khớp xương)"
        },
        {
          name: "Hiệu suất chuyển đổi huỳnh quang (Fluorescence Quantum Yield)",
          equation: "Phi = Photon_emitted / Photon_absorbed",
          result: "0.68"
        }
      ]
    },
    summary: "Lớp giáp sừng huỳnh quang neon và cường hóa lực kẹp ngón tay mang lại khả năng cận chiến khóa khớp siêu cấp cùng đặc tính tự vệ thụ động trong tối."
  },
  "giant-water-bug": {
    trait_name: "Tuyến Nước Bọt Độc Belostomatoxin và Cánh Chèo Thủy Lực Chân Sau",
    title: "Người Lai Bọ Nước Khổng Lồ - Sát Thủ Đầm Lầy Tê Liệt",
    slug: "giant-water-bug-human-splice",
    sci_fi_hype: "Tích hợp tuyến độc Belostomatoxin của Bọ Nước Khổng Lồ vào hạch nước bọt và móng vuốt cẳng tay người lai. Đồng thời, cấu trúc cơ đùi chân sau được gia cố bằng các hàng lông cứng hydrophobic, đóng vai trò như mái chèo thủy lực tăng tốc cực đại trong môi trường nước ngọt và bùn lầy. Người lai có thể phóng ra peptide belostomatoxin trực tiếp vào hệ tuần hoàn đối phương thông qua ngòi đốt ẩn ở cổ tay, phân hủy cơ và tê liệt motor neuron chỉ trong 10 giây.",
    scientific_reality: "Phân tích phản ứng sinh học: Sự tích hợp belostomatoxin đòi hỏi hệ thống màng lọc lipid kép trong tuyến độc để ngăn chặn hiện tượng tự tiêu mô do các enzyme lipase và protease ngoại lai. Các sợi lông vây thủy lực ở chân sử dụng keratin kỵ nước đặc biệt liên kết chéo với màng tế bào biểu bì, gia tăng 65% diện tích đẩy nước mà không làm cản trở vận động trên cạn nhờ khả năng tự gập dẹt.",
    spliced_stats: {
      strength: 86,
      durability: 85,
      speed: 90,
      weaponry: 94,
      special: 88,
      lethality: 96
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1250,
      venom_injection_rate_mg_s: 1.5,
      swim_velocity_m_s: 6.8,
      formulas: [
        {
          name: "Tốc độ bơi thủy lực chân sau (Hydrodynamic Velocity)",
          equation: "v = sqrt(2 * F_thrust / (C_d * rho * A))",
          result: "6.8 m/s"
        },
        {
          name: "Thời gian phân hủy mô cơ do Belostomatoxin (Tissue Proteolysis Rate)",
          equation: "t_paralysis = C_venom * K_block / r_diffusion",
          result: "10 seconds"
        }
      ]
    },
    summary: "Lai ghép gen Bọ Nước Khổng Lồ mang lại khả năng bơi lội thủy lực vượt trội kết hợp chất độc thần kinh belostomatoxin gây phân hủy mô và tê liệt tức thời."
  },
  "goliath-birdeater": {
    trait_name: "Hệ Thống Lông Ngứa Có Ngạnh Ngược Urticating Setae và Cặp Vuốt Chelicerae Cường Lực",
    title: "Người Lai Nhện Ăn Chim Goliath - Đồ Tể Lông Sọc Độc",
    slug: "goliath-birdeater-human-splice",
    sci_fi_hype: "Cấy ghép tuyến lông ngứa urticating setae của Nhện Ăn Chim Goliath lên toàn bộ lớp da vùng cẳng tay và ngực người lai. Khi bị tấn công hoặc khi chủ động xoa tay cơ học, người lai phóng ra hàng triệu sợi lông ngứa siêu vi dạng ngạnh ngược cơ học lơ lửng trong không khí, gây kích ứng mù lòa tức thời cho mắt và phù nề đường hô hấp của đối phương. Đồng thời, cấu trúc xương ngón tay được trang bị cặp vuốt sừng rỗng chứa nọc độc chitin dài 3cm có khả năng cắm sâu và bơm độc tố làm tê liệt mô cơ đối thủ.",
    scientific_reality: "Phân tích phản ứng sinh học: Các lông ngứa urticating setae được cấu tạo từ các gai chitin rỗng chứa các protein độc tính nhẹ gây giải phóng histamine nội sinh. Để bảo vệ chính mình khỏi sốc phản vệ, da người lai được bổ sung một lớp keratin hóa dày bọc sáp trơn ngăn lông ngứa cắm ngược. Khả năng tự rụng chi bị kẹt (autotomy) được tái cấu trúc ở khớp bả vai/khớp hông thông qua một vùng thắt cơ trơn tự động co khít để ngăn xuất huyết tức thì.",
    spliced_stats: {
      strength: 92,
      durability: 86,
      speed: 82,
      weaponry: 95,
      special: 90,
      lethality: 92
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 2200,
      urticating_hair_density_cm2: 25000,
      claw_penetration_force_n: 2800,
      formulas: [
        {
          name: "Lực đâm xuyên của vuốt Chelicerae (Penetration Force)",
          equation: "F_penetrate = P_arm * mechanical_advantage",
          result: "2.80 kN"
        },
        {
          name: "Mật độ phân tán lông ngứa trong không khí (Urticating Hair Dispersion)",
          equation: "C_hair = N_hairs / (4/3 * pi * r_sphere^3)",
          result: "5.8 * 10^5 hairs/m³"
        }
      ]
    },
    summary: "Lai ghép gen Nhện Ăn Chim Goliath đem lại khả năng phóng lông ngứa Urticating Setae khống chế đám đông diện rộng và cặp vuốt Chelicerae bơm độc cận chiến hủy diệt."
  },
  "antlion": {
    trait_name: "Hệ Thống Râu Cảm Biến Hóa Học và Mechanoreceptive Bristles",
    title: "Người Lai Kiến Sư Tử - Sát Thủ Địa Chấn Tĩnh Lặng",
    slug: "antlion-human-splice",
    sci_fi_hype: "Cấy ghép mã di truyền của Kiến Sư Tử vào hệ vỏ sừng và hệ thần kinh trung ương của người lai. Các lông cảm thụ cơ học (mechanoreceptive bristles) cấp độ nano được phân bố dày đặc dọc theo biểu bì cẳng chân và bàn chân người lai, cho phép họ nhận diện chấn động Rayleigh siêu việt truyền qua lòng đất. Ngoài ra, cặp râu hình chùy đặc trưng của Kiến Sư Tử được tích hợp vào vùng xương chũm sau tai, cung cấp khả năng phát hiện các phân tử hóa học và pheromone mục tiêu lơ lửng trong không khí từ khoảng cách 100 mét. Khi phục kích, cơ thể người lai có thể duy trì trạng thái tĩnh tuyệt đối, ngưng trệ 98% hoạt động trao đổi chất để trở nên hoàn toàn vô hình trước mọi cảm biến hồng ngoại và sinh học.",
    scientific_reality: "Phân tích phản ứng sinh học: Lông cảm thụ mechanoreceptive bristles yêu cầu cấy các vi cảm biến piezo-chitin nối trực tiếp với dây thần kinh chày thông qua các synapse polymer sinh học dẫn điện. Sự suppression chuyển hóa cơ bản (metabolic suppression) được điều khiển bởi hoóc-môn peptide nhân tạo tiết ra từ tuyến yên, làm chậm nhịp tim xuống 4 nhịp/phút mà không gây thiếu oxy não nhờ các tế bào hồng cầu hemoglobin biến đổi có khả năng mang oxy gấp 10 lần bình thường. Quá trình ngăn tích tụ nitrogenous waste được xử lý bằng cách tái tuần hoàn urea qua chu trình ornithine tăng cường ở gan người lai.",
    spliced_stats: {
      strength: 85,
      durability: 88,
      speed: 82,
      weaponry: 90,
      special: 96,
      lethality: 92
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 65,
      metabolic_suppression_ratio: 0.02,
      vibration_sensitivity_hz: 1200,
      formulas: [
        {
          name: "Tốc độ truyền sóng rung động cơ học (Seismic Wave Velocity)",
          equation: "v = sqrt(G / rho)",
          result: "180 m/s (cát mịn)"
        },
        {
          name: "Năng lượng tiêu thụ ở trạng thái ẩn mình (Suppressed Metabolic Rate)",
          equation: "E_metabolic = E_basal * (1 - suppression_ratio)",
          result: "1.68 kJ/hour"
        }
      ]
    },
    summary: "Lai ghép gen Kiến Sư Tử mang lại khả năng cảm nhận địa chấn cấp độ nano cùng công nghệ ẩn mình ngưng trệ sinh học tuyệt đối, biến người lai thành thợ săn phục kích hoàn hảo."
  },
  "bombardier-beetle": {
    trait_name: "Buồng Phản Ứng Enzim Catalase-Peroxidase Kép và Van Phun Xoay",
    title: "Người Lai Bọ Cánh Cứng Xịt Ga - Pháo Hóa Chất Nhiệt Học",
    slug: "bombardier-beetle-human-splice",
    sci_fi_hype: "Cấy ghép buồng phản ứng hóa học kép sinh học của Bọ Cánh Cứng Xịt Ga vào lòng bàn tay hoặc khớp cẳng tay người lai. Hệ tuần hoàn tổng hợp và lưu trữ Hydroquinone (25%) và Hydrogen Peroxide (60%) tại hai túi nang riêng biệt bọc bằng màng bảo vệ Teflon sinh học. Khi kích hoạt phản xạ co thắt, hai chất dịch này được đẩy vào buồng phản ứng cơ xương dọc cẳng tay, tiếp xúc với các enzim Catalase và Peroxidase siêu hoạt tính. Phản ứng oxy hóa bộc phát giải phóng nhiệt lượng khổng lồ, phun ra tia benzoquinone sôi sục ở nhiệt độ 100°C với vận tốc 10 m/s qua vòi phun chitin xoay 360 độ ở cổ tay, thiêu rụi và ăn mòn lớp biểu bì của đối thủ trong tích tắc.",
    scientific_reality: "Phân tích phản ứng sinh học: Để ngăn tia benzoquinone boiling 100°C và hơi độc làm tổn hại hệ thống cơ ngực và đường hô hấp của chính người lai, các van khí khổng hô hấp nhân tạo dọc cổ và ngực tự động đóng kín khi có tín hiệu xung thần kinh kích hoạt phun ga. Cổ tay và lòng bàn tay được bao bọc bởi lớp màng sừng lipid phân tầng cực dày chống chịu nhiệt và kháng hóa chất ăn mòn cao. Buồng phản ứng được lót bằng các sợi chitin gia cường liên kết resilin để tiêu tán chấn động nổ lách tách do các xung lực phản hồi áp suất cao gây ra.",
    spliced_stats: {
      strength: 84,
      durability: 92,
      speed: 80,
      weaponry: 98,
      special: 86,
      lethality: 97
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1550,
      spray_temperature_c: 100,
      reaction_pressure_atm: 12,
      formulas: [
        {
          name: "Nhiệt lượng bộc phát từ phản ứng oxy hóa Hydroquinone (Reaction Heat)",
          equation: "Q = m_hydroquinone * delta_H_reaction",
          result: "205 kJ per spray"
        },
        {
          name: "Tốc độ phun hỗn hợp nhiệt độc (Jet Velocity)",
          equation: "v = sqrt(2 * delta_P / rho)",
          result: "10.4 m/s"
        }
      ]
    },
    summary: "Tích hợp Buồng Phản Ứng Hóa Học Kép cho phép phun tia hóa chất Benzoquinone boiling 100°C ăn mòn và gây sốc nhiệt cực mạnh đối thủ, đồng thời bảo vệ vật chủ nhờ lớp biểu bì kháng nhiệt."
  },
  "darwins-bark-spider": {
    trait_name: "Gen Tơ Siêu Dai MaSp4 và Tuyến Tiết Tơ Áp Lực Cao",
    title: "Người Lai Nhện Vỏ Cây Darwin - Đao Phủ Dây Cáp Sinh Học",
    slug: "darwins-bark-spider-human-splice",
    sci_fi_hype: "Cấy ghép mã gen tơ protein MaSp4 của Nhện Vỏ Cây Darwin vào cơ thể người lai. Các tế bào biểu bì ở cổ tay hoặc lòng bàn tay được cải tiến cấu trúc sinh học thành các lỗ phun tơ áp suất cao (spinnerets) nối liền với tuyến sản sinh dung dịch spidroin trong cơ thể. Khi kích hoạt co thắt cơ, người lai dệt và phóng ra các sợi tơ siêu mảnh nhưng dai hơn Kevlar gấp 10 lần, kéo dài tới 50 mét vắt ngang qua các khoảng không lớn. Sợi tơ có khả năng co giãn trên 90% động năng va chạm, hấp thụ toàn bộ lực quán tính của mục tiêu di chuyển nhanh mà không hề đứt rách.",
    scientific_reality: "Phân tích phản ứng sinh học: Để tổng hợp chuỗi protein tơ MaSp4 có tỷ lệ glycine-proline cực cao, hệ tiêu hóa của vật chủ được tăng cường hấp thụ protein gấp 3 lần và bổ sung chuỗi liên kết chéo disulfide thông qua enzim tổng hợp sulfhydryl oxidase. Các ống dẫn tơ kéo dài dọc cẳng tay cho phép định hình thẳng hàng các bó sợi protein trước khi đùn ra ngoài cổ tay, tối ưu hóa lực kéo căng tối đa. Cơ chế bảo vệ cổ tay sử dụng một lớp sụn Resilin đàn hồi cao bao quanh vòi phun để triệt tiêu phản chấn áp lực phun tơ.",
    spliced_stats: {
      strength: 86,
      durability: 84,
      speed: 84,
      weaponry: 96,
      special: 92,
      lethality: 90
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 480,
      silk_toughness_mj_m3: 520,
      max_extension_ratio: 0.95,
      formulas: [
        {
          name: "Động năng hấp thụ tối đa của lưới tơ (Maximum Absorbed Energy)",
          equation: "E_absorb = toughness_vol * Vol_silk",
          result: "26 kJ (tương đương đạn súng trường)"
        },
        {
          name: "Tốc độ kéo tơ tức thời (Spidroin Extrusion Velocity)",
          equation: "v_ext = Q_flow / (pi * r_nozzle^2)",
          result: "15 m/s"
        }
      ]
    },
    summary: "Lai ghép gen Nhện Vỏ Cây Darwin mang lại khả năng dệt tơ siêu bền chịu tải trọng khổng lồ, tạo thành dây cáp cứu sinh hoặc vũ khí vô hiệu hóa mục tiêu di chuyển nhanh."
  },
  "diving-bell-spider": {
    trait_name: "Lớp Lông Kỵ Nước Hydrophobic Setae và Chuông Lặn Fick-Gill",
    title: "Người Lai Nhện Bong Bóng Nước - Tiên Phong Thủy Chiến",
    slug: "diving-bell-spider-human-splice",
    sci_fi_hype: "Tích hợp mã di truyền của Nhện Bong Bóng Nước vào hệ thống biểu bì và nang lông của người lai. Bề mặt da vùng ngực và chi dưới mọc các sợi lông hydrophobic setae siêu mịn bọc sáp alkane kháng nước tuyệt đối. Khi lặn xuống nước, các sợi lông này khóa chặt một lớp bong bóng khí mỏng bao quanh cơ thể như một bộ giáp khí động học. Lớp bong bóng hoạt động như một mang vật lý chủ động (physical gill), liên tục hấp thu khí oxy hòa tan từ nước và thải khí carbon dioxide ra ngoài theo cơ chế khuếch tán Fick, cho phép người lai sinh tồn vô thời hạn dưới độ sâu mà không cần bình khí.",
    scientific_reality: "Phân tích phản ứng sinh học: Hiện tượng khuếch tán thụ động qua ranh giới khí-nước được hỗ trợ bởi lớp màng bán thấm lipid dệt từ tơ của nhện nước bao quanh vùng ngực. Áp suất riêng phần của oxy (pO2) trong bong bóng giảm khi người lai hô hấp, tạo động lực thúc đẩy O2 hòa tan từ nước xâm nhập vào bong bóng khí. Hệ thống nang lông chân bì được tăng sinh mật độ mạch máu để vận chuyển trực tiếp oxy bám hút qua da vào tuần hoàn chung mà không cần thông qua phổi hoàn toàn, ngăn ngừa hội chứng nhiễm độc nitơ (decompression sickness).",
    spliced_stats: {
      strength: 86,
      durability: 84,
      speed: 84,
      weaponry: 82,
      special: 98,
      lethality: 80
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 320,
      hydrophobic_angle_degrees: 145,
      oxygen_diffusion_rate_mol_s: 0.00035,
      formulas: [
        {
          name: "Tốc độ khuếch tán oxy qua màng mang vật lý (Fick's First Law)",
          equation: "J = -D * A * (dC / dx)",
          result: "0.45 ml O2/sec"
        },
        {
          name: "Độ sâu lặn tối đa không cần thở (Max Safe Dive Depth)",
          equation: "Depth_max = (pO2_min * K_henry - P_ambient) / delta_P",
          result: "18 meters"
        }
      ]
    },
    summary: "Cơ chế Mang Vật Lý từ lông kỵ nước bọc sáp alkane giúp tự động trao đổi khí oxy từ môi trường nước ngọt/mặn, giải phóng người lai khỏi sự lệ thuộc vào bình dưỡng khí."
  },
  "dracula-ant": {
    trait_name: "Hàm Snapping Mandible Lực Đàn Hồi Cơ Học Tích Năng",
    title: "Người Lai Kiến Dracula - Sát Thủ Chớp Nhoáng Cận Chiến",
    slug: "dracula-ant-human-splice",
    sci_fi_hype: "Cấy ghép cơ chế khớp trượt cơ học tích lũy thế năng của Kiến Dracula vào cấu trúc xương hàm và cổ tay người lai. Hệ thống xương cẳng tay được thiết kế lại thành cơ cấu đàn hồi lò xo (spring-loaded) kết hợp bó cơ gấp co rút cực mạnh. Khi tích lũy lực, xương cổ tay khóa chặt để nén năng lượng vào khớp resilin dẻo dai. Khi mở khóa phản xạ, lực đập hàm/đấm snaps ra với tốc độ lên đến 90 m/s (324 km/h) chỉ trong 23 micro giây, tạo ra sóng xung kích chấn động làm nát vụn áo giáp và vô hiệu hóa hệ thần kinh của đối phương tức khắc.",
    scientific_reality: "Phân tích phản ứng sinh học: Để chịu đựng gia tốc va chạm khổng lồ mà không tự làm gãy xương tay của chính mình, các mô liên kết của người lai được gia cố bằng resilin liên kết chéo với sợi collagen xoắn kép. Tín hiệu kích hoạt xung lực đi qua các sợi thần kinh bọc myelin siêu dày để đảm bảo tốc độ truyền dẫn cực nhanh. Cú đấm bộc phát sinh ra áp suất cục bộ cực lớn, do đó da đầu ngón tay được bọc sừng dày chứa lớp chất đệm phân tán chấn lực.",
    spliced_stats: {
      strength: 86,
      durability: 84,
      speed: 84,
      weaponry: 98,
      special: 88,
      lethality: 96
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 950,
      strike_velocity_m_s: 90,
      strike_acceleration_g: 4000,
      formulas: [
        {
          name: "Lực va chạm tức thời bộc phát (Impact Force)",
          equation: "F = m_fist * a_strike",
          result: "1.8 kN (đủ nghiền nát xương bê tông)"
        },
        {
          name: "Thời gian giải phóng thế năng đàn hồi (Energy Release Duration)",
          equation: "dt = s_strike / v_avg",
          result: "23 microseconds"
        }
      ]
    },
    summary: "Tích hợp Khớp Khóa Tích Năng Đàn Hồi Resilin mang lại cú đấm bộc phát tốc độ 90 m/s nhanh nhất sinh giới, dễ dàng phá hủy mục tiêu giáp dày bằng sóng xung kích chấn động."
  },
  "australian-bulldog-ant": {
    trait_name: "Tuyến Độc Thần Kinh Myrmeciin-Toxin",
    title: "Người Lai Kiến Bulldog Úc - Sát Thủ Cận Chiến",
    slug: "australian-bulldog-ant-human-splice",
    sci_fi_hype: "Cường hóa tế bào gốc tủy xương người bằng mã di truyền của Kiến Bulldog Úc, biến hệ thống tuần hoàn thành nhà máy sản xuất siêu peptide độc lực Myrmecia-Toxin. Lớp mô dưới da được tái cấu trúc thành mạng lưới túi độc siêu nhỏ. Khi chiến đấu, nọc độc được bài tiết trực tiếp vào các thụ thể khớp tay và xương ngón, sinh ra lực bộc phát hủy diệt, phá hủy các kết cấu thần kinh ngoại biên của mục tiêu chỉ qua một cú chạm cơ học nhẹ. Đôi mắt được tái cấu trúc khớp với tế bào mắt kép bulldog, mang lại thị giác lập thể 3D cực nhạy, theo dõi và bắt trọn từng chuyển động của đối thủ ban đêm.",
    scientific_reality: "Phân tích phản ứng sinh học: Việc tích hợp peptide Myrmeciin đòi hỏi thiết lập màng bọc lipid nhân tạo xung quanh tuyến độc để bảo vệ tế bào nội mô của vật chủ khỏi hiện tượng tự tiêu tế bào (autolysis). Để ngăn chặn tình trạng sốc phản vệ thứ cấp do histamine giải phóng ồ ạt, một cơ chế feedback âm (negative feedback loop) được cấy vào vùng dưới đồi để tự động tiết ra glucocorticoid điều hòa. Xương khớp tay chịu áp lực phản chấn cực lớn khi bộc phát lực đấm nọc độc, do đó lớp đệm resilin tự nhiên từ khớp hàm kiến cần được tổng hợp sinh học để đệm giữa các đốt ngón tay người, hấp thụ 78% lực xung kích cơ học.",
    spliced_stats: {
      strength: 86,
      durability: 80,
      speed: 88,
      weaponry: 90,
      special: 82,
      lethality: 92
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafted_weight_g: 4.2,
      punch_velocity_ms: 28,
      impact_force_n: 2450,
      formulas: [
        {
          name: "Lực tác động cực đại khớp tay (Peak Impact Force)",
          equation: "F = m * (dv / dt) + F_neuro",
          result: "2.45 kN"
        },
        {
          name: "Gia tốc xung kích nọc độc (Venom Ejection Acceleration)",
          equation: "a = v / t_ejection",
          result: "140 m/s²"
        }
      ]
    },
    summary: "Lai ghép thành công Tuyến Độc Thần Kinh Myrmeciin-Toxin mang lại khả năng cận chiến tầm gần đáng sợ với độc chất làm tê liệt hệ tuần hoàn đối phương."
  },
  "bullet-ant": {
    trait_name: "Tuyến Nọc Poneratoxin và Peptide Tạo Lỗ Màng",
    title: "Người Lai Kiến Đạn - Đỉnh Cao Đau Đớn",
    slug: "bullet-ant-human-splice",
    sci_fi_hype: "Cơ thể người lai được tích hợp các cụm hạch thần kinh và tuyến nọc tổng hợp độc tố Poneratoxin siêu đậm đặc của Kiến Đạn. Một chiếc gai chitin trơn lướt dài 8mm tích hợp dưới xương ngón tay giữa có thể thu gọn. Khi đâm vào mục tiêu, Poneratoxin lập tức phong tỏa kênh Natri nhạy cảm điện thế, kích hoạt 100% thụ thể đau cảm giác TRPV1 và phóng thích pore-forming peptides tạo các lỗ thủng nano trên màng tế bào. Cơn đau bùng phát dữ dội gấp 10 lần morphine-block, kéo dài suốt 24 giờ liên tục, khiến đối phương tê liệt toàn thân vì sốc đau đớn cơ học.",
    scientific_reality: "Phân tích phản ứng sinh học: Để ngăn Poneratoxin tự kích hoạt hệ thống thần kinh của chính người lai, các thụ thể cảm giác đau (nociceptors) ở vùng ngoại vi được bao bọc bởi một lớp vỏ bọc myelin nhân tạo liên kết chéo glycoprotein. Hệ thống gan và thận được tăng cường các đại thực bào chuyên biệt có thụ thể dọn dẹp peptide ngoại lai nhanh chóng khi độc tố rò rỉ vào tuần hoàn nội bộ. Các sợi Resilin giảm chấn được cấy quanh cổ tay để phân tán xung lực phản hồi từ cú châm chích thô bạo.",
    spliced_stats: {
      strength: 85,
      durability: 82,
      speed: 88,
      weaponry: 95,
      special: 84,
      lethality: 96
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafted_weight_g: 8.0,
      punch_velocity_ms: 22,
      impact_force_n: 1800,
      formulas: [
        {
          name: "Lực va chạm bộc phát (Burst Impact Force)",
          equation: "F = m_hand * a_punch",
          result: "1.80 kN"
        },
        {
          name: "Thời gian phong tỏa xung thần kinh (Nerve Block Latency)",
          equation: "t = d² / (2 * D_diffusion)",
          result: "1.5 seconds"
        }
      ]
    },
    summary: "Sử dụng Tuyến Nọc Poneratoxin gây tê liệt thần kinh và đau đớn cực độ kéo dài để vô hiệu hóa đối thủ nhanh chóng."
  },
  "brazilian-wandering-spider": {
    trait_name: "Độc Tố Thần Kinh PhTx3, Peptide PnTx2-6 và Lông Bám Dính Scopulae",
    title: "Người Lai Nhện Lang Thang Brazil - Sát Thủ Phức Hợp Độc Lực",
    slug: "brazilian-wandering-spider-human-splice",
    sci_fi_hype: "Cấy ghép tuyến nọc hỗn hợp đa peptide và cấu trúc lông bám bàn chân của Nhện Lang Thang Brazil. Cơ thể người lai được tích hợp các túi độc chứa peptide PhTx3 (ức chế kênh canxi) và PnTx2-6 (kích hoạt nitric oxide gây giãn mạch thể hang và liệt thần kinh ngoại biên) cùng cấu trúc lông scopulae sinh học ở lòng bàn tay và bàn chân. Khi chiến đấu, các sợi lông scopulae tạo lực van der Waals khổng lồ giúp người lai leo bám trên mọi bề mặt trơn trượt. Các đòn cận chiến giải phóng lượng nọc cực độc gây liệt cơ hô hấp và suy tuần hoàn đối thủ chỉ trong 30 giây.",
    scientific_reality: "Phân tích phản ứng sinh học: Việc kết hợp PhTx3 và PnTx2-6 yêu cầu các thụ thể màng synapse của người lai được bọc một lớp glycoprotein biến đổi kháng độc nhằm ngăn ngừa tự nhiễm độc. Lực bám van der Waals của hàng tỷ lông siêu nhỏ scopulae đòi hỏi diện tích tiếp xúc bàn tay/chân được gia tăng thông qua các nếp gấp da vi mô dạng lồi lõm xếp nếp. Hệ thống lông Trichobothria trên da tay giúp lọc các rung động tần số thấp (10-50 Hz) để phát hiện hơi thở đối thủ trong bóng tối.",
    spliced_stats: {
      strength: 84,
      durability: 80,
      speed: 92,
      weaponry: 94,
      special: 88,
      lethality: 98
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 180,
      venom_ld50_mg_kg: 0.134,
      calcium_channel_blocking_ratio: 0.98,
      formulas: [
        {
          name: "Lực liên kết van der Waals bám dính cực đại (Max Adhesion Force)",
          equation: "F_adhesion = N_scopulae * f_single_hair * cos(theta)",
          result: "1.12 kN"
        },
        {
          name: "Thời gian truyền chất độc tê liệt (Venom Propagation Time)",
          equation: "t_paralysis = L_axon / v_impulse + t_blockade",
          result: "28 seconds"
        }
      ]
    },
    summary: "Lai ghép gen Nhện Lang Thang Brazil cung cấp khả năng tiêm độc tố thần kinh PhTx3 và peptide PnTx2-6 gây liệt tức thì kết hợp cơ quan cảm biến rung động scopulae bám trần siêu việt."
  },
  "tarantula-hawk": {
    trait_name: "Ngòi Châm Chitin Pompilidotoxin Điện Thế",
    title: "Người Lai Tò Vò Săn Nhện - Tê Liệt Khớp Bào",
    slug: "tarantula-hawk-human-splice",
    sci_fi_hype: "Cấy ghép tuyến nang tò vò săn nhện trực tiếp vào dọc xương cẳng tay người lai. Xương trụ tiến hóa thành một ống phóng ngòi châm chitin dài 7.5cm có khả năng co rút tự động. Nọc độc tích hợp peptide Pompilidotoxin tinh khiết cực độ, ức chế tức thì kênh natri nhạy cảm điện thế trong các sợi thần kinh vận động của đối thủ, đưa mục tiêu vào trạng thái tê liệt cơ xương hoàn toàn trong vòng 5 giây mà không làm tim ngừng đập - một trạng thái giam cầm sống đáng sợ nhất thế giới tự nhiên.",
    scientific_reality: "Phân tích phản ứng sinh học: Peptid Pompilidotoxin có độc tính chọn lọc cực cao, nhưng ở cơ thể người lai, cần duy trì nồng độ kháng sinh sinh học tế bào để hệ miễn dịch không sinh ra kháng thể IgG trung hòa chất độc. Ngòi châm chitin dài 7.5cm được bọc bằng lớp màng nhầy tự miễn chứa mucopolysaccharide nhằm tránh hiện tượng thải ghép dị vật ở vùng cẳng tay. Đồng thời, cấu trúc xương cẳng tay được gia cố mật độ khoáng gấp đôi để chịu đựng mô-men xoắn phản chấn cơ học khi phóng ngòi châm qua da với áp lực nén thủy tĩnh lớn.",
    spliced_stats: {
      strength: 82,
      durability: 85,
      speed: 86,
      weaponry: 94,
      special: 84,
      lethality: 95
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafted_weight_g: 8.5,
      punch_velocity_ms: 35,
      impact_force_n: 3200,
      formulas: [
        {
          name: "Áp lực phóng ngòi châm (Stinger Injection Pressure)",
          equation: "P = F_hydraulic / A_stinger",
          result: "18.5 MPa"
        },
        {
          name: "Thời gian tê liệt hệ thần kinh motor (Motor Nerve Block Latency)",
          equation: "t_block = d² / (2 * D_diffusion)",
          result: "4.8 seconds"
        }
      ]
    },
    summary: "Tích hợp Ngòi Châm Chitin Pompilidotoxin Điện Thế cung cấp khả năng khống chế cơ sinh học tuyệt đối, vô hiệu hóa hoàn toàn khả năng di chuyển của đối phương."
  },
  "trap-jaw-ant": {
    trait_name: "Hệ Thống Phóng Đại Resilin Chốt Đàn Hồi Hàm Dưới",
    title: "Người Lai Kiến Bẫy Hàm - Xung Kích Cơ Học Siêu Tốc",
    slug: "trap-jaw-ant-human-splice",
    sci_fi_hype: "Cơ chế bẫy hàm kinh hoàng của Odontomachus bauri được biến đổi và tích hợp vào hệ thống cơ xương hai cánh tay của người lai. Các gân cơ nhị đầu được thay thế bằng các bó tơ Resilin tổng hợp có độ đàn hồi vô địch. Khi khóa chốt khớp khuỷu tay, năng lượng được tích trữ chậm và giải phóng tức thì trong vòng 130 micro-giây, tạo ra một cú đấm/chặt siêu tốc đạt vận tốc 65 m/s (234 km/h), đập tan mọi lớp giáp thép cứng nhất và tạo ra phản lực đẩy người lai lùi lại thoát hiểm cực nhanh.",
    scientific_reality: "Phân tích phản ứng sinh học: Gia tốc cú đấm đạt tới mức 10,000G, vượt xa giới hạn chịu đựng thông thường của mô liên kết người. Do đó, các đệm giảm chấn sinh học cấu tạo từ glycoprotein lỏng (tương tự dịch tuyến Dufour ở khớp hàm kiến) được tổng hợp quanh ổ khớp vai và khớp khuỷu tay để phân tán 96% phản lực va chạm. Nếu không có hệ thống đệm này, toàn bộ khớp vai người lai sẽ bị vỡ vụn ngay lần đầu tiên kích hoạt chốt giải phóng đàn hồi.",
    spliced_stats: {
      strength: 92,
      durability: 82,
      speed: 95,
      weaponry: 88,
      special: 80,
      lethality: 91
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafted_weight_g: 15.0,
      punch_velocity_ms: 65,
      impact_force_n: 6125,
      formulas: [
        {
          name: "Thế năng đàn hồi tích lũy Resilin (Elastic Potential Energy)",
          equation: "E = 0.5 * k * x²",
          result: "280 Joules"
        },
        {
          name: "Gia tốc bộc phát nắm đấm (Punch Acceleration)",
          equation: "a = v / dt",
          result: "500,000 m/s² (50,968 G)"
        }
      ]
    },
    summary: "Tận dụng cơ cấu Resilin giải phóng chớp nhoáng tạo ra cú đấm áp lực cao phá vỡ giáp phòng ngự."
  },
  "vinegaroon": {
    trait_name: "Tuyến Phun Axit Caprylic-Axetic Đuôi Roi",
    title: "Người Lai Bọ Cạp Giấm - Pháo Axit Đuôi Roi",
    slug: "vinegaroon-human-splice",
    sci_fi_hype: "Tích hợp mã gen của Bọ Cạp Giấm, vùng xương cùng và cụm dây thần kinh đuôi ngựa của người lai được biến đổi thành một roi đuôi chitin linh hoạt dài 1.2m, có khả năng xoay hướng 360 độ cực kỳ cơ động. Tuyến hậu môn phát triển thành buồng nén áp lực thủy tĩnh, tự động tổng hợp hỗn hợp hóa chất đậm đặc chứa 85% Axit Axetic và 15% Axit Caprylic làm dung môi siêu hòa tan lớp lipid sinh học. Khi kích hoạt phản xạ co thắt cơ vòng cường độ cao, người lai bắn ra tia axit đậm đặc chính xác xa tới 5 mét, ăn mòn lớp bảo vệ chitin hoặc protein biểu bì của đối thủ ngay lập tức, kèm theo mùi giấm nồng nặc gây kích ứng đường hô hấp nghiêm trọng.",
    scientific_reality: "Phân tích phản ứng sinh học: Để ngăn chặn sự ăn mòn ngược từ hỗn hợp axit siêu đậm đặc, lòng ống dẫn và buồng chứa ở gốc roi đuôi được lót bởi lớp màng tế bào sừng hóa (cornified envelope) giàu protein liên kết chéo và các hạt mucopolysaccharide kháng axit. Axit Caprylic đóng vai trò là tác nhân hoạt hóa bề mặt, làm giảm sức căng bề mặt của tia axit để nó bám dính cực tốt vào bề mặt mục tiêu. Để chịu lực co bóp cơ học lên tới 25 atm trong buồng nén mà không gây vỡ nứt mô, thành cơ vùng chậu của người lai được gia cố bằng bó cơ vân xoắn ốc xếp lớp dày đặc.",
    spliced_stats: {
      strength: 80,
      durability: 85,
      speed: 82,
      weaponry: 93,
      special: 88,
      lethality: 91
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1200,
      acid_jet_velocity_ms: 67.8,
      spray_distance_m: 5,
      formulas: [
        {
          name: "Áp lực phun axit cực đại (Maximum Acid Spray Pressure)",
          equation: "P = F_compression / A_nozzle",
          result: "2.53 MPa"
        },
        {
          name: "Vận tốc dòng tia axit (Acid Jet Velocity)",
          equation: "v = sqrt(2 * P / rho)",
          result: "67.8 m/s"
        }
      ]
    },
    summary: "Lai ghép thành công Tuyến Phun Axit Đuôi Roi mang lại vũ khí tấn công tầm xa bằng hóa chất ăn mòn cực kỳ nguy hiểm, có khả năng vô hiệu hóa lớp giáp hữu cơ của đối phương."
  },
  "sand-scorpion": {
    trait_name: "Hệ Thống Thụ Cảm Cơ Học Định Vị Địa Chấn Cát BCSS",
    title: "Người Lai Bọ Cạp Cát - Thích Nghi Địa Chấn",
    slug: "sand-scorpion-human-splice",
    sci_fi_hype: "Tích hợp mã gen Bọ Cạp Cát, hệ thống thụ cảm cơ học BCSS (basitarsal compound slit sensilla) được cấy trực tiếp vào các gân gót và bàn chân người lai. Toàn bộ cơ thể người lai trở thành một máy thu địa chấn siêu nhạy, cảm nhận được rung động Rayleigh siêu việt truyền qua mặt đất. Trong phạm vi 50 mét, bất kỳ bước chân, nhịp tim hay chuyển động cơ học nào của kẻ thù cũng bị định vị chính xác góc độ và khoảng cách tới mức mili-giây. Ngoài ra, tế bào biểu bì ngoài được biến đổi để phát huỳnh quang màu xanh lam lục rực rỡ dưới bức xạ điện từ, cảnh báo mức năng lượng sinh học đang bộc phát.",
    scientific_reality: "Phân tích phản ứng sinh học: Các slit sensilla nhân tạo đòi hỏi kết nối trực tiếp với các sợi thần kinh hướng tâm của dây thần kinh chày (tibial nerve) qua các synapse nhân tạo cấu tạo từ polymer dẫn điện sinh học. Để tránh nhiễu do chính bước chân của người lai tạo ra, một cơ chế triệt tiêu tiếng ồn chủ động (active noise cancellation) được thiết lập tại tủy sống: mỗi khi người lai bước đi, các tín hiệu vận động đi ly tâm sẽ tạm thời ức chế các thụ thể BCSS tương ứng trong vòng 20 micro-giây. Lớp cutin phát quang xanh lục lam đòi hỏi cung cấp liên tục tiền chất beta-carboline từ chế độ ăn uống và được duy trì trong tế bào sừng thượng bì mà không gây viêm nhiễm.",
    spliced_stats: {
      strength: 81,
      durability: 88,
      speed: 84,
      weaponry: 80,
      special: 95,
      lethality: 83
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 45,
      punch_velocity_ms: 20,
      impact_force_n: 1500,
      formulas: [
        {
          name: "Góc định vị địa chấn lệch pha (Seismic Angle Resolution)",
          equation: "theta = arcsin(v_seismic * dt / d_feet)",
          result: "1.2 degrees"
        },
        {
          name: "Độ nhạy biên độ sóng địa chấn (Seismic Amplitude Sensitivity)",
          equation: "A_min = C_seismic / f_signal",
          result: "0.15 nm"
        }
      ]
    },
    summary: "Tích hợp Hệ Thống Thụ Cảm Địa Chấn BCSS mang lại khả năng định vị mục tiêu cực kỳ chính xác qua rung động đất, vô hiệu hóa mọi hình thức ngụy trang và tàng hình."
  },
  "goliath-beetle": {
    trait_name: "Lớp Khung Xương Ngoài Chitin-Protein Gia Cường Lưới Nano",
    title: "Người Lai Bọ Hung Goliath - Kẻ Thừa Hành Thiết Giáp",
    slug: "goliath-beetle-human-splice",
    sci_fi_hype: "Biến đổi cấu trúc chất nền ngoại bào da người bằng mã di truyền của Bọ Hung Goliath, cấy ghép các cụm nano chitin đan xen chéo đa hướng kết hợp với protein dẻo resilin trực tiếp vào hạ bì và biểu bì. Lớp da người lai hóa sừng thành bộ giáp sinh học cứng cáp như thép rèn nhưng cực kỳ linh hoạt, có khả năng triệt tiêu 95% xung lực chấn động cơ học từ đạn bắn và đòn đánh nặng. Cột sống và các ổ khớp lớn được gia cố thêm các đĩa đệm sinh học làm từ dịch canxi cacbonat tự cứng kết hợp sừng chữ Y rỗng chịu tải trọng lớn, biến người lai thành một cỗ xe tăng bất khả xâm phạm trên chiến trường.",
    scientific_reality: "Phân tích phản ứng sinh học: Để ngăn chặn tình trạng cứng hóa toàn bộ cơ thể làm hạn chế cử động và hô hấp của người lai, lớp giáp chitin được cấu trúc theo dạng các vảy giáp hình lục giác trượt lên nhau (scale structures) kết nối bởi màng resilin đàn hồi cao. Hệ miễn dịch được điều hòa bằng cách biểu hiện protein tự nhận diện CD47 trên bề mặt sợi chitin để tránh đại thực bào tấn công. Thải nhiệt cơ thể (thermoregulation) được giải quyết qua các kênh dẫn nhiệt vi mô rỗng chạy dọc dưới lớp giáp kết nối với các mạch biểu mô vùng nách và bẹn.",
    spliced_stats: {
      strength: 94,
      durability: 96,
      speed: 75,
      weaponry: 85,
      special: 88,
      lethality: 89
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 4500,
      punch_velocity_ms: 18,
      impact_force_n: 2950,
      formulas: [
        {
          name: "Độ bền chống đâm thủng cực đại (Max Puncture Resistance)",
          equation: "E_absorption = integral(sigma * epsilon * dV) + E_resilin",
          result: "4.25 kJ"
        },
        {
          name: "Khả năng phân tán xung lực cơ học (Shock Dissipation Factor)",
          equation: "F_trans = F_impact * e^(-k * t_plate)",
          result: "0.05 (95% attenuation)"
        }
      ]
    },
    summary: "Tích hợp lớp biểu bì Chitin-Protein gia cường mang lại khả năng chống đạn và triệt tiêu xung kích cơ học đỉnh cao, đưa độ bền bỉ của người lai lên mức tối đa."
  },
  "diabolical-ironclad-beetle": {
    trait_name: "Khớp Nối Khóa Jigsaw và Elytra Phân Lớp Laminate",
    title: "Người Lai Bọ Cánh Cứng Sắt Diabolic - Pháo Đài Di Động",
    slug: "diabolical-ironclad-beetle-human-splice",
    sci_fi_hype: "Tích hợp mã gen của Bọ Cánh Cứng Sắt Diabolic, tái cấu trúc toàn bộ khung xương của người lai thành cấu trúc bán chitin gia cường đa lớp. Trục xương sống được bọc bởi các khớp khóa jigsaw đan xen dạng răng cưa elip có khả năng tự trượt nhẹ để phân tán chấn động. Toàn bộ lồng ngực và các cơ quan nội tạng được che chắn bởi một lớp giáp elytra sừng hóa chịu lực ép tĩnh khổng lồ lên tới 39,000 lần trọng lượng cơ thể. Bất kể là đòn tấn công vật lý tầm gần hay đạn bắn từ vũ khí hạng nhẹ, xung lực cơ học đều bị hấp thụ, tiêu tán 99% qua cơ chế phân tách lớp biểu bì (delamination) mà không gây vỡ nát mô nội tạng.",
    scientific_reality: "Phân tích phản ứng sinh học: Cấu trúc giáp elytra của bọ cánh cứng sắt được liên kết chặt với tấm ức dưới bụng thông qua hệ thống khớp nối răng cưa khóa chặt dạng zipper, đòi hỏi người lai phải phát triển hệ cơ liên sườn và cơ ngực có độ đàn hồi cực cao để duy trì hô hấp dưới áp lực nén. Để ngăn hiện tượng thải ghép do dị vật chitin, các đại thực bào ở da được biến đổi biểu hiện protein tự nhận diện CD47 trên màng bao bọc sợi protein-resilin liên kết chéo. Xương sườn và xương chậu được bọc lớp đệm resilin để hấp thụ 98% lực ép tĩnh.",
    spliced_stats: {
      strength: 90,
      durability: 98,
      speed: 70,
      weaponry: 82,
      special: 92,
      lethality: 85
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 5200,
      compression_resistance_n: 2925000,
      formulas: [
        {
          name: "Khả năng hấp thụ năng lượng chấn động (Delamination Energy Absorption)",
          equation: "E_absorb = G_c * b * A_delam",
          result: "8.5 kJ"
        },
        {
          name: "Lực ép tĩnh giới hạn chịu đựng (Max Static Compressive Force)",
          equation: "F_max = C_jigsaw * E_elytra * (t_plate)³",
          result: "2.93 MN"
        }
      ]
    },
    summary: "Tích hợp Khớp Nối Khóa Jigsaw và Elytra Phân Lớp Laminate mang lại khả năng chống chịu lực nén tĩnh cực hạn và tiêu tán chấn động cơ học vật lý, biến người lai thành một pháo đài phòng ngự bất khả xâm phạm."
  },
  "desert-locust": {
    trait_name: "Hệ Khớp Resilin Chân Sau và Cơ Chế Polyphenism Thể Hạch",
    title: "Người Lai Châu Chấu Sa Mạc - Siêu Cấp Nhảy Cao & Biến Kiểu Hình",
    slug: "desert-locust-human-splice",
    sci_fi_hype: "Tích hợp cấu trúc đệm Resilin đàn hồi siêu việt của Châu Chấu Sa Mạc vào hệ thống gân gót và bao khớp gối người lai. Khi nén trọng tâm, năng lượng đàn hồi cơ học được tích lũy cực đại và phóng thích trong vòng 0.8 mili-giây, đẩy người lai bật nhảy cao tới 15 mét không tiếng động. Đặc biệt, mã gen polyphenism pha bầy đàn được đồng hóa trực tiếp vào hệ nội tiết vùng dưới đồi: khi đi vào trạng thái chiến đấu tập thể hoặc kích động mạnh, cơ thể người lai sản sinh serotonin ồ ạt, biến đổi màu sắc lớp biểu bì ngoài sang vàng sẫm rực lửa, tăng gấp đôi tốc độ trao đổi chất, giảm cảm giác mệt mỏi và tăng 40% sát thương đòn đánh vật lý cơ học.",
    scientific_reality: "Phân tích phản ứng sinh học: Protein Resilin được tổng hợp sinh học và chèn chéo trực tiếp với sợi Collagen loại I trong gân Achilles người lai, tạo ra một phức hợp cơ - gân có hiệu suất đàn hồi vượt quá 97% mà không bị mỏi cơ học. Sự tích lũy serotonin ồ ạt kích hoạt pha biến kiểu hình (phase polyphenism) yêu cầu tăng cường hệ thống tủy thượng thận tiết adrenaline và noradrenaline được kiểm soát để tránh ngộ độc catecholamine nội sinh. Đồng thời, các sợi thụ cảm cơ học khí động học (wind-sensitive hairs) được cấy dọc theo vùng gáy, cung cấp thông tin thời gian thực về hướng gió và gia tốc góc giúp người lai định vị tư thế hoàn hảo trên không trung.",
    spliced_stats: {
      strength: 88,
      durability: 82,
      speed: 94,
      weaponry: 84,
      special: 92,
      lethality: 88
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 850,
      jump_height_m: 15,
      takeoff_velocity_ms: 17.15,
      formulas: [
        {
          name: "Thế năng đàn hồi tích lũy Resilin gân Achilles (Achilles Elastic Potential Energy)",
          equation: "E = 0.5 * k * (delta_x)²",
          result: "11.02 kJ"
        },
        {
          name: "Gia tốc cất cánh cực đại (Takeoff Acceleration)",
          equation: "a = v_takeoff / t_release",
          result: "21,437 m/s² (2,185 G)"
        }
      ]
    },
    summary: "Tích hợp Hệ Khớp Resilin Chân Sau và Cơ Chế Polyphenism Thể Hạch mang lại khả năng bật nhảy cao vượt trội cùng pha biến thái bầy đàn tăng sức mạnh chiến đấu tập thể."
  },
  "gear-planthopper": {
    trait_name: "Hệ Thống Khớp Bánh Răng Đồng Bộ Cơ Học Đốt Đùi Chân Sau",
    title: "Người Lai Côn Trùng Bánh Răng - Đột Phá Gia Tốc Đồng Bộ",
    slug: "gear-planthopper-human-splice",
    sci_fi_hype: "Tích hợp cấu trúc bánh răng cơ học sinh học (trochanteral gears) đặc trưng của Issus coleoptratus vào hệ thống khớp háng và xương đùi của người lai. Các răng cưa siêu nhỏ làm từ chitin-resilin tự nhiên được đồng bộ hóa hoàn hảo giữa hai chân với sai số thời gian nhỏ hơn 30 micro-giây. Khi người lai bật nhảy, năng lượng cơ học được giải phóng đồng thời tuyệt đối, tạo ra lực đẩy tuyến tính khổng lồ với gia tốc cực đại vượt qua mọi giới hạn thông thường, cho phép bứt tốc hoặc đổi hướng đột ngột trên không trung với độ chính xác cơ học tuyệt đối.",
    scientific_reality: "Phân tích phản ứng sinh học: Để ngăn chặn tình trạng mỏi vật liệu và gãy nứt các răng cưa ở khớp háng người dưới tải trọng động nặng, các răng cưa được gia cường bằng các nguyên tố mangan và lưu huỳnh liên kết chéo. Lòng ổ khớp được bọc một lớp màng bôi trơn sinh học hoạt dịch chứa các hạt lipid và glycoprotein giúp giảm ma sát trượt cơ học xuống mức tối thiểu (hệ số ma sát < 0.01). Vùng cơ mông và cơ đùi trước được bao bọc bởi lớp màng resilin đàn hồi cao để hấp thụ 85% xung lực chấn động khi tiếp đất.",
    spliced_stats: {
      strength: 86,
      durability: 84,
      speed: 96,
      weaponry: 80,
      special: 90,
      lethality: 85
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 380,
      jump_velocity_ms: 18.5,
      takeoff_time_ms: 0.9,
      formulas: [
        {
          name: "Độ đồng bộ lực nhảy giữa hai chân (Jump Synchronicity)",
          equation: "dt_sync = |t_left - t_right| < 30 microseconds",
          result: "25 μs"
        },
        {
          name: "Gia tốc cất cánh tức thời (Takeoff Acceleration)",
          equation: "a = v_jump / dt_takeoff",
          result: "20,556 m/s² (2,095 G)"
        }
      ]
    },
    summary: "Tích hợp Bộ Khớp Bánh Răng Đồng Bộ ở đốt đùi giúp giải phóng lực nhảy đồng thời ở cả hai chân với sai lệch cực tiểu, tạo ra gia tốc bứt tốc vượt bậc."
  },
  "weaver-ant": {
    trait_name: "Hệ Thống Đệm Bám Chân Hút Thủy Lực Arolia và Pheromone Phối Hợp Xích Lực Kéo Căng",
    title: "Người Lai Kiến Dệt Lá - Kẻ Thống Trị Trọng Lực & Lực Kéo Tập Thể",
    slug: "weaver-ant-human-splice",
    sci_fi_hype: "Cấy ghép cơ quan đệm bám chân arolia hoạt động bằng áp lực dịch thủy lực cơ học của Kiến Dệt Lá vào bàn chân và lòng bàn tay người lai, cho phép bám dính siêu việt vào mọi bề mặt trơn nhẵn ngược chiều trọng lực. Đồng thời cấy ghép hệ pheromone liên lạc nội tiết: khi chiến đấu phối hợp nhóm, cơ thể tự động giải phóng một lượng formic acid làm tăng khả năng chịu đau và kích hoạt trạng thái liên kết cơ 'xích lực' (body-bridge), cho phép nhiều người lai móc nối với nhau chịu tải trọng hàng chục tấn.",
    scientific_reality: "Cơ chế cơ học: Giác bám chân arolia sử dụng áp lực hemolymph để tự động bơm phồng màng linh hoạt nằm giữa đôi vuốt cong ở đầu ngón, tạo diện tích tiếp xúc bám dính tăng 200%. Hệ thống cơ xương khớp được gia cố bằng sợi elastin và các tế bào cơ bắp vi mô chịu tải kéo dọc, ngăn ngừa trật khớp khi chịu lực căng lớn. Pheromone kích hoạt tuyến thượng thận giải phóng catecholamine điều hòa hô hấp và tuần hoàn mà không gây sốc phản vệ.",
    spliced_stats: {
      strength: 91,
      durability: 88,
      speed: 85,
      weaponry: 80,
      special: 96,
      lethality: 85
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 920,
      max_adhesion_force_n: 12500,
      contact_angle_degrees: 15,
      formulas: [
        {
          name: "Lực bám dính thủy lực của giác bám chân (Arolia Adhesion Force)",
          equation: "F_adhesion = A_contact * delta_P_capillary * cos(theta)",
          result: "12.5 kN"
        },
        {
          name: "Khả năng chịu lực căng của xích người nối (Body-Bridge Tensile Strength)",
          equation: "T_max = N_members * sigma_muscle * A_cross_section",
          result: "28.5 kN (cho nhóm 3 người)"
        }
      ]
    },
    summary: "Sở hữu giác bám chân arolia thủy lực cho phép leo trèo thẳng đứng hoàn hảo và liên kết cơ bắp bộc phát lực căng chịu tải kéo khổng lồ khi hoạt động phối hợp nhóm."
  },
  "whip-spider": {
    trait_name: "Cặp Chân Roi Thụ Cảm Basiconic Sensilla 3D và Phản Xạ Kìm Pedipalps Gia Cường Kẽm",
    title: "Người Lai Nhện Đuôi Roi - Tử Thần Định Vị Bóng Tối",
    slug: "whip-spider-human-splice",
    sci_fi_hype: "Tích hợp đôi chân roi cảm giác dài 2 mét biến đổi từ khớp xương cánh tay, chứa hơn 10.000 lông cảm biến cơ học trichobothria và tế bào hóa học basiconic sensilla. Người lai có thể quét không gian, dựng lại bản đồ 3D nhiệt và khí động học của môi trường xung quanh trong bóng tối tuyệt đối. Cặp pedipalps ở cẳng tay biến thành hai chiếc kìm gai sừng sắc bén gia cường kẽm và mangan, phóng ra ôm sập và cắm sâu vào con mồi với phản xạ thần kinh cực hạn dưới 5 mili-giây.",
    scientific_reality: "Cơ chế tích hợp: Bộ não trung khu (synganglion) được cấy ghép thùy nấm (mushroom bodies) lớn để tiếp nhận và xử lý tín hiệu chênh lệch áp suất không khí cực nhỏ truyền từ trichobothria. Đầu gai sừng của kìm pedipalps chứa các vi tinh thể kẽm và mangan liên kết chéo chất nền chitin, tăng độ cứng lên 4.5 GPa (tương đương thép không gỉ). Dây thần kinh vận động chi trước có đường kính sợi lớn hơn để truyền xung thần kinh siêu tốc bypass các trạm trung gian.",
    spliced_stats: {
      strength: 87,
      durability: 85,
      speed: 96,
      weaponry: 94,
      special: 97,
      lethality: 92
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 1850,
      whip_length_cm: 220,
      strike_response_time_ms: 4.8,
      formulas: [
        {
          name: "Độ phân giải bản đồ không gian của chân roi (Spatial Sensor Resolution)",
          equation: "d_min = v_air * dt_synaptic",
          result: "0.24 mm"
        },
        {
          name: "Lực sập của kìm Pedipalps gia cường kim loại (Pedipalps Strike Force)",
          equation: "F_strike = m_arm * a_strike",
          result: "3.85 kN"
        }
      ]
    },
    summary: "Đôi chân roi cảm biến không gian 3D trong tối kết hợp cặp kìm pedipalps gia cường kẽm sập nhanh dưới 5ms biến người lai thành thợ săn cận chiến đáng sợ."
  },
  "atlas-moth": {
    trait_name: "Đôi Ăng-ten Lông Chim Thụ Cảm Siêu Pheromone và Đôi Cánh Giả Đầu Rắn Hổ Mang Chiều Sâu 3D",
    title: "Người Lai Ngài Tằm Vũ Trụ - Kẻ Tạo Ảo Giác Rắn Hổ Mang & Thụ Cảm Tần Số",
    slug: "atlas-moth-human-splice",
    sci_fi_hype: "Cấy ghép đôi ăng-ten lông chim lớn ở vùng thái dương chứa hàng triệu tế bào thụ cảm hóa học siêu nhạy, cho phép phát hiện một phân tử mùi mục tiêu duy nhất trong bầu khí quyển. Đồng thời tích hợp đôi cánh màng chitin siêu rộng mô phỏng hoa văn 3D đầu rắn hổ mang bành cổ ở chóp cánh. Khi đập cánh rung động, người lai vừa tạo ra lực nâng khí động học lớn để bay lượn thụ động không tiếng động, vừa tạo ảo giác một đôi mắt rắn hổ mang chuyển động khiến kẻ thù hoảng loạn tê liệt ý chí.",
    scientific_reality: "Cơ chế khí động học và thần kinh: Đôi ăng-ten lông chim chứa basiconic sensilla mật độ cao liên kết với thùy khứu giác vỏ não. Cấu trúc vảy cánh hiển vi xếp lớp giúp triệt tiêu tiếng ồn tần số cao khi bay và chống bám nước mưa nhờ góc kỵ nước 138 độ. Hoa văn đầu rắn có chiều sâu quang học nhờ sự phân bố hạt sắc tố melanin và guanin tạo tương phản ánh sáng. Lồng ngực được tăng sinh cơ bay thụ động dẻo dai sử dụng ít năng lượng oxy hơn.",
    spliced_stats: {
      strength: 80,
      durability: 83,
      speed: 89,
      weaponry: 82,
      special: 99,
      lethality: 85
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafts_weight_g: 3100,
      wingspan_cm: 280,
      olfactory_sensitivity_limit_moles: "1 * 10^-18 M",
      formulas: [
        {
          name: "Lực nâng khí động học bay lượn thụ động (Aerodynamic Lift Force)",
          equation: "L = 0.5 * rho_air * v² * S_wing * C_L",
          result: "820 N"
        },
        {
          name: "Hiệu quả kỵ nước của vảy cánh (Water Contact Angle on Wings)",
          equation: "theta_c = arccos(f_solid * cos(theta_0) - f_air)",
          result: "138 degrees"
        }
      ]
    },
    summary: "Sở hữu đôi ăng-ten khứu giác nhạy bén cấp độ phân tử và cánh màng ngụy trang đầu rắn 3D bay lượn không tiếng động để trinh sát và gây kinh hãi cho mục tiêu."
  }
};

// Fallback helper to generate splice content if creature not pre-defined
function generateFallbackProfile(creature) {
  const p4p = creature.ai_p4p_score || 70;
  const name = creature.name;
  return {
    trait_name: `Gen Tự Vệ Cường Hóa ${name}`,
    title: `Người Lai ${name} - Thích Nghi Đặc Biệt`,
    slug: `${creature.id}-human-splice`,
    sci_fi_hype: `Công nghệ ghép tủy tích hợp mã gen sinh học của ${name}. Cánh tay và hệ cơ khớp được bao phủ bởi các lớp sợi chitin chịu lực lớn, tái cấu trúc mật độ tế bào thần kinh truyền dẫn mang lại phản xạ siêu việt và khả năng tấn công chớp nhoáng kiểu loài hoang dã.`,
    scientific_reality: `Ghép tế bào của loài ${name} yêu cầu tái cân bằng nội môi huyết tương và tiêm bổ sung glycoprotein đặc chế để chống hiện tượng tự miễn dịch và thải ghép thứ cấp. Sức chịu lực cơ xương khớp người được gia cố thông qua tổng hợp canxi nano siêu bền.`,
    spliced_stats: {
      strength: Math.min(100, Math.round(p4p * 1.05)),
      durability: Math.min(100, Math.round(p4p * 1.02)),
      speed: Math.min(100, Math.round(p4p * 1.03)),
      weaponry: Math.min(100, Math.round(p4p * 1.08)),
      special: Math.min(100, Math.round(p4p * 0.98)),
      lethality: Math.min(100, Math.round(p4p * 1.1))
    },
    formulas_and_data: {
      human_mass_kg: 75,
      grafted_weight_g: 5.5,
      punch_velocity_ms: 22,
      impact_force_n: 1800,
      formulas: [
        {
          name: "Lực va chạm bộc phát (Burst Impact Force)",
          equation: "F = m_hand * a_punch",
          result: "1.80 kN"
        }
      ]
    },
    summary: `Thừa hưởng các đặc tính phòng vệ và cơ năng học độc đáo của loài ${name} để tối ưu hóa khả năng thích ứng chiến đấu.`
  };
}

async function main() {
  console.log("🔍 Fetching top 3 target creatures for Human Splicing...");
  
  // Reuse the query logic from get-human-splice-targets.js
  const { data: dbCreatures, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score, characteristics, unique_traits");

  if (cErr || !dbCreatures) {
    console.error("❌ Error fetching creatures:", cErr?.message);
    process.exit(1);
  }

  const { data: dbSplices, error: sErr } = await supabase
    .from("human_splices")
    .select("id, creature_id, title, slug");

  if (sErr) {
    console.error("❌ Error fetching human splices:", sErr.message);
    process.exit(1);
  }

  const splicesMap = {};
  dbCreatures.forEach(c => {
    splicesMap[c.id] = [];
  });
  if (dbSplices) {
    dbSplices.forEach(s => {
      if (splicesMap[s.creature_id]) {
        splicesMap[s.creature_id].push({
          id: s.id,
          title: s.title,
          slug: s.slug
        });
      }
    });
  }

  const rankedCreatures = dbCreatures.map(c => {
    const existing = splicesMap[c.id] || [];
    return {
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      ai_p4p_score: c.ai_p4p_score || 50,
      characteristics: c.characteristics || "",
      unique_traits: c.unique_traits || "",
      existing_splices_count: existing.length,
      existing_splices: existing
    };
  });

  rankedCreatures.sort((a, b) => {
    if (a.existing_splices_count !== b.existing_splices_count) {
      return a.existing_splices_count - b.existing_splices_count;
    }
    if (a.ai_p4p_score !== b.ai_p4p_score) {
      return b.ai_p4p_score - a.ai_p4p_score;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = rankedCreatures.slice(0, 3);
  console.log(`🎯 Identified targets:\n${targets.map((t, idx) => `   ${idx + 1}. ${t.name} (${t.id}) - P4P: ${t.ai_p4p_score}, Existing: ${t.existing_splices_count}`).join("\n")}`);

  // Create human splice payloads
  const payload = targets.map(target => {
    const defaultData = predefinedProfiles[target.id] || generateFallbackProfile(target);
    return {
      creature_id: target.id,
      title: defaultData.title,
      trait_name: defaultData.trait_name,
      slug: defaultData.slug,
      spliced_stats: defaultData.spliced_stats,
      formulas_and_data: defaultData.formulas_and_data,
      summary: defaultData.summary,
      sci_fi_hype: defaultData.sci_fi_hype,
      scientific_reality: defaultData.scientific_reality
    };
  });

  const tempFilePath = path.join(__dirname, "temp-human-splice.json");
  console.log(`💾 Saving generated splice profiles to temporary file: ${tempFilePath}`);
  fs.writeFileSync(tempFilePath, JSON.stringify(payload, null, 2), "utf8");

  console.log("⚡ Executing update-human-splice.js...");
  try {
    const result = execSync(`node ${path.join(__dirname, "update-human-splice.js")} ${tempFilePath}`).toString();
    console.log(result);
  } catch (err) {
    console.error("❌ Failed to update human splice database:", err.message);
  } finally {
    if (fs.existsSync(tempFilePath)) {
      console.log(`🧹 Cleaning up temporary file: ${tempFilePath}`);
      fs.unlinkSync(tempFilePath);
    }
  }

  console.log("\n📊 Execution Summary:");
  payload.forEach(item => {
    console.log(`- ${item.title}:`);
    console.log(`  + Gen ghép: ${item.trait_name}`);
    console.log(`  + Sức mạnh (STR): ${item.spliced_stats.strength}/100`);
    console.log(`  + Độ bền (DEF): ${item.spliced_stats.durability}/100`);
    console.log(`  + Tốc độ (SPD): ${item.spliced_stats.speed}/100`);
    console.log(`  + Khả năng tương thích: ${item.spliced_stats.special}%`);
  });
}

if (require.main === module) {
  main().catch(err => {
    console.error("💥 Unhandled main exception:", err);
  });
}

module.exports = { predefinedProfiles };
