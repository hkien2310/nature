const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 53: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'tarantula-hawk') {
      newC.diet_type = 'parasitic';
      newC.diet_items = ["mật hoa", "nhựa cây", "trái cây lên men", "nhện tarantula (cho ấu trùng)"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng đơn lẻ. Con cái sau khi được thụ tinh sẽ đi săn nhện tarantula khổng lồ, dùng ngòi châm tiêm nọc tê liệt hoàn toàn rồi kéo con mồi vào hang sâu, sau đó đẻ một quả trứng duy nhất lên bụng nhện. Ấu trùng nở ra ăn dần thịt nhện sống từ các cơ quan kém quan trọng để giữ mồi tươi lâu nhất.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 40.0;
      newC.size_max_mm = 51.0;
      newC.weight_avg_g = 1.5;

      newC.characteristics = appendText(c.characteristics, "Lớp biểu bì kitin phủ kim loại màu xanh đen óng ánh hấp thụ nhiệt hiệu quả và phản chiếu ánh sáng tự nhiên tạo hiệu ứng thị giác xua đuổi. Đôi cánh cam rực rỡ là dấu hiệu aposematism kinh điển chống kẻ săn mồi.");
      newC.survival_method = appendText(c.survival_method, "Tiêm nọc độc Pompilidotoxin chứa peptide đặc hiệu gây phong tỏa kênh natri (voltage-gated sodium channels) của nhện tarantula, làm tê liệt hệ thần kinh vận động nhưng giữ nhịp tim và tuần hoàn ổn định trong nhiều tuần.");
      newC.unique_traits = appendText(c.unique_traits, "Nọc độc có cú đốt xếp thứ hai trên thế giới về độ đau đớn (đạt điểm 4.0 tối đa trên chỉ số đau Schmidt), kích hoạt lập tức thụ thể đau TRPV1 ở động vật có vú mà không gây tổn thương mô vĩnh viễn.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Ngòi châm dài đến 7mm không có ngạnh cho phép châm tiêm liên tục và thu hồi linh hoạt.");
      addUniqueItem(newC.strengths, "Chất độc Pompilidotoxin trong nọc có độ đặc hiệu thần kinh cực cao.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tái tạo nọc độc cực kỳ chậm, mất từ 3-5 ngày để hồi phục lượng nọc sau khi cạn kiệt.");
      addUniqueItem(newC.weaknesses, "Hoạt động kém và mất kiểm soát vận động khi nhiệt độ môi trường giảm dưới 15 độ C.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chỉ có tò vò săn nhện cái sở hữu ngòi châm tự vệ và săn mồi, trong khi tò vò đực hoàn toàn vô hại và chỉ bay đi hút mật hoa.");
      addUniqueItem(newC.fun_facts, "Cơn đau từ cú đốt của tò vò săn nhện dữ dội đến mức lời khuyên y khoa duy nhất là nằm xuống và la hét để tránh làm tổn thương bản thân.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2015.03.011",
        label: "Toxicon - Structure and function of pompilidotoxins in spider wasp venom"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/een.12999",
        label: "Ecological Entomology - Host selection and nesting behavior of Pepsis wasps"
      });

    } else if (c.id === 'tardigrade') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giun tròn", "trùng bánh xe", "tảo đơn bào", "các loài gấu nước nhỏ hơn"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính hoặc đơn tính. Con cái đẻ từ 1 đến 30 trứng trực tiếp vào lớp vỏ cutin cũ của nó trước khi lột xác. Vỏ cũ này đóng vai trò như một chiếc kén bảo vệ trứng khỏi các yếu tố môi trường bất lợi bên ngoài cho đến khi nở.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.01;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 0.1;
      newC.size_max_mm = 1.2;
      newC.weight_avg_g = 0.000003;

      newC.characteristics = appendText(c.characteristics, "Lớp vỏ cutin bán trong suốt bao bọc cơ thể cho phép co rút thể tích tối đa để chuyển sang trạng thái tun khi mất nước.");
      newC.survival_method = appendText(c.survival_method, "Khi thiếu nước, tế bào biểu bì tổng hợp hàng loạt protein CAHS (Cytoplasmic Abundant Heat Soluble) tạo trạng thái gel thủy tinh bảo vệ bào tương và ngăn đứt gãy DNA.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu protein liên kết DNA chuyên biệt Dsup (Damage Suppressor) hoạt động như một lá chắn vật lý chống lại sự bắn phá của tia bức xạ gamma và các gốc tự do hydroxyl.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sức chống chịu phi thường trước áp suất cơ học lên đến 6000 atm (gấp 6 lần rãnh Mariana).");
      addUniqueItem(newC.strengths, "Khả năng phục hồi hoạt động sinh học bình thường gần như lập tức sau khi tiếp xúc lại với phân tử nước.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có khả năng di chuyển hoặc tự vệ chủ động khi đang ở trạng thái tun khô, phụ thuộc hoàn toàn vào tác động dòng chảy môi trường.");
      addUniqueItem(newC.weaknesses, "Lớp cutin mỏng manh dễ bị tổn thương cơ học bởi các loài ve bét ký sinh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "DNA của gấu nước chứa tới 1.2% gen từ vi khuẩn, nấm và thực vật thông qua chuyển gen ngang (HGT) hỗ trợ tổng hợp enzyme kháng nấm.");
      addUniqueItem(newC.fun_facts, "Gấu nước có thể sống sót sau khi bị bắn ra từ súng với vận tốc va chạm lên tới 900 m/s.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.7554/eLife.47682",
        label: "eLife - Dsup protein binds to nucleosomes and protects DNA"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.abf1211",
        label: "Science - Mechanisms of tardigrade resistance to extreme conditions"
      });

    } else if (c.id === 'tasmanian-devil') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["xác thối động vật", "chuột túi wallaby", "chim nhỏ", "côn trùng", "bò sát nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, là loài thú có túi. Thời gian mang thai chỉ 21 ngày, sau đó sinh ra tới 20-30 con non nhỏ bằng hạt gạo. Con non phải bò nhanh vào túi của mẹ. Túi mẹ chỉ có 4 núm vú, nên chỉ tối đa 4 con sống sót nuôi dưỡng trong túi khoảng 4 tháng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 25.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 570.0;
      newC.size_max_mm = 652.0;
      newC.weight_avg_g = 8000.0;

      newC.characteristics = appendText(c.characteristics, "Sọ ngắn và rộng cùng cơ cắn thái dương khổng lồ liên kết trực tiếp với mào xương chẩm lớn tạo cánh tay đòn bẩy cơ học tối đa giúp tối ưu hóa lực cắn.");
      newC.survival_method = appendText(c.survival_method, "Tiêu hóa triệt để cả xương, lông và móng vuốt động vật nhờ nồng độ axit dịch vị dạ dày cực kỳ cao tiêu diệt mọi mầm bệnh từ xác thối.");
      newC.unique_traits = appendText(c.unique_traits, "Máu và sữa của con cái chứa các peptide Cathelicidin tự nhiên siêu mạnh có khả năng tiêu diệt các siêu vi khuẩn kháng thuốc cực đoan.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sở hữu lực cắn tuyệt đối lên tới 553 psi mạnh nhất thế giới thú ăn thịt khi so sánh tương quan thể tích cơ thể.");
      addUniqueItem(newC.strengths, "Hệ tuần hoàn bền bỉ cho phép di chuyển liên tục suốt đêm săn tìm xác thối.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Mắc chứng bệnh ung thư lây truyền qua vết cắn DFTD độc nhất vô nhị đang đe dọa trực tiếp đến sự tồn vong của loài.");
      addUniqueItem(newC.weaknesses, "Sự đa dạng di truyền vô cùng thấp khiến loài dễ bị xóa sổ trước các dịch bệnh truyền nhiễm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Quỷ Tasmania tích lũy chất béo dư thừa ở đuôi; một chiếc đuôi mập mạp tròn trịa là minh chứng cho một con quỷ khỏe mạnh đầy đủ thức ăn.");
      addUniqueItem(newC.fun_facts, "Chúng có tiếng gầm đa tần số rùng rợn mà người định cư châu Âu đầu tiên nghe thấy đã ví như tiếng quỷ sa tăng hét giữa đêm hoang dã.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/srep35077",
        label: "Scientific Reports - Tasmanian devil milk peptides kill superbugs"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/eva.12850",
        label: "Evolutionary Applications - Rapid evolutionary response to cancer in Tasmanian devils"
      });

    } else if (c.id === 'texas-horned-lizard') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến lửa Pogonomyrmex", "mối", "bọ cánh cứng", "sâu bướm"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đào hang nông trong cát sa mạc khô ráo để đẻ từ 10 đến 30 quả trứng. Trứng được vùi sâu dưới cát ấm để ấp thụ động và nở sau khoảng 4-6 tuần.';
      newC.locomotion = 'walk';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 69.0;
      newC.size_max_mm = 114.0;
      newC.weight_avg_g = 50.0;

      newC.characteristics = appendText(c.characteristics, "Cơ thể dẹt phẳng rộng ngang được trang bị hàng loạt sừng chẩm lớn bằng chất sừng bọc xương ở vùng đầu gáy giúp ngăn chặn rắn nuốt chửng.");
      newC.survival_method = appendText(c.survival_method, "Co thắt cơ vòng tĩnh mạch cảnh trong làm tăng áp lực xoang tĩnh mạch dưới mắt (orbital sinuses) để phun dòng máu nóng xa đến 1.5m để phòng ngự chó hoang.");
      newC.unique_traits = appendText(c.unique_traits, "Huyết tương chứa các protein vô hiệu hóa độc tố peptide từ nọc kiến lửa và tích tụ hóa chất này tạo mùi vị đắng khó chịu cho dòng máu mắt tự vệ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế phun máu mắt tự vệ độc đáo làm hoảng sợ động vật họ chó.");
      addUniqueItem(newC.strengths, "Mạng lưới rãnh mao dẫn siêu vi trên vảy giúp thu gom nước mưa và sương đêm thụ động dẫn về miệng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có phản xạ chạy trốn tốc độ cao, di chuyển chậm chạp dễ bị bắt.");
      addUniqueItem(newC.weaknesses, "Quá phụ thuộc vào nguồn kiến lửa bản địa Pogonomyrmex chiếm hơn 70% khẩu phần ăn.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng có thể tự vùi mình vào cát sa mạc chỉ trong vòng chưa đầy 5 giây bằng cách lắc hông liên tục để gạt cát lên lưng.");
      addUniqueItem(newC.fun_facts, "Khi đối phó với rắn, thằn lằn gai Texas không phun máu mắt mà phồng to cơ thể lên gấp đôi và dựng gai nhọn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.213233",
        label: "Journal of Experimental Biology - Capillary water collection mechanisms in horned lizards"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cbpa.2004.09.006",
        label: "Comparative Biochemistry and Physiology - Formic acid resistance in horned lizards"
      });

    } else if (c.id === 'thorny-devil') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến đen Iridomyrmex", "kiến nhỏ sa mạc"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ khoảng 3-10 quả trứng vào một hang sâu đào nghiêng dưới cát ấm từ tháng 9 đến tháng 12. Trứng nở sau 3-4 tháng ấp nhiệt độ sa mạc thụ động.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 85.0;

      newC.characteristics = appendText(c.characteristics, "Toàn thân phủ đầy gai sừng nhọn hoắt dẹt phẳng giúp khuếch tán ánh sáng ngụy trang và bảo vệ vật lý tuyệt đối trước các đòn mổ của chim.");
      newC.survival_method = appendText(c.survival_method, "Khi bị tấn công, chúng cúi đầu thật giấu vào giữa hai chân trước và đưa đầu giả chứa mô mỡ dày phía sau gáy ra chịu đòn thay.");
      newC.unique_traits = appendText(c.unique_traits, "Hệ thống rãnh mao dẫn phân cấp (hierarchical sub-capillaries) giữa các vảy sừng có thể tự động đẩy nước ngược chiều trọng lực trực tiếp về khóe miệng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Vận chuyển nước thụ động siêu việt thông qua tiếp xúc cơ thể với cát ẩm hoặc sương đọng trên gai sừng.");
      addUniqueItem(newC.strengths, "Dáng đi lắc lư giật cục mô phỏng lá khô rơi đánh lừa hệ thống nhận diện chuyển động của chim săn mồi.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Chế độ ăn hẹp tuyệt đối chỉ ăn kiến đen nhỏ khiến chúng cực kỳ nhạy cảm với biến động môi trường.");
      addUniqueItem(newC.weaknesses, "Cơ thể trở nên đông cứng bất động khi nhiệt độ sa mạc xuống thấp ban đêm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tên chi Moloch được đặt theo tên của một vị thần cổ đại khét tiếng đòi hiến tế người do hình dáng kỳ dị đầy gai nhọn gớm ghiếc của nó.");
      addUniqueItem(newC.fun_facts, "Chỉ cần chôn chân của thằn lằn quỷ gai vào cát ẩm, da chân sẽ tự động hút nước chạy lên lưng rồi vào khóe miệng chỉ trong vài phút.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsos.170591",
        label: "Royal Society Open Science - Passive capillary water transport in thorny devil skin"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsos.160591",
        label: "Royal Society Open Science - Skin structure and passive water transport in Moloch horridus"
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
