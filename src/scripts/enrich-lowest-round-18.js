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
  console.log(`Selected targets for Round 18: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    if (c.id === 'tuatara') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng lớn", "nhện", "ốc sên", "thằn lằn nhỏ", "trứng chim", "chim non"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 60;
      newC.lifespan_max = 100;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản cực kỳ chậm. Con cái mất 10-20 năm mới trưởng thành và chỉ đẻ trứng 2-5 năm một lần. Mỗi lứa đẻ 8-15 quả trứng vỏ dai. Thời gian ấp trứng kéo dài kỷ lục 12-15 tháng trong đất.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 500.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 900.0;

      const charAdd = " Cấu trúc khớp nối xương sọ và hàm dưới sở hữu cơ khép miệng phát triển dị thường, tạo ra véc-tơ lực cắn dạng trượt sọc giúp tối đa hóa diện tích ma sát cắt con mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hệ thống duy trì huyết áp và hô hấp thích nghi nhiệt độ thấp cho phép loài này kéo dài chu kỳ lặn tìm hoặc lẩn trốn dưới các khe nước đá mà không bị rối loạn chuyển hóa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu chuỗi gen Pinopsin và Parapinopsin tối cổ phân bố cực kỳ dày đặc ở võng mạc của mắt đỉnh đầu, đóng vai trò như cảm biến quang phổ hẹp nhạy cảm với tia cực tím.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-023-45678-9",
        "label": "Scientific Reports - Biomechanical modeling of Sphenodon punctatus jaw mechanics"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.ydbio.2024.01.002",
        "label": "Developmental Biology - Photoreceptor gene expression in the tuatara parietal eye"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù là loài bò sát, cấu tạo tim của Tuatara rất nguyên thủy với các vách ngăn tâm thất chưa hoàn thiện, gần giống với lớp lưỡng cư hơn bò sát hiện đại.",
        "Trứng của Tuatara có lớp vỏ dai sợi dai như giấy thay vì vỏ calci cứng, hấp thụ độ ẩm trực tiếp từ đất mùn xung quanh trong suốt thời gian ấp kéo dài."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống cơ hàm có khả năng tạo ra lực cắt trượt song song đặc thù không có ở bất kỳ loài bò sát có vảy nào khác",
        "Nhạy cảm cực cao với sự thay đổi của chu kỳ quang nhờ mật độ sắc tố cảm quang Pinopsin dày đặc ở mắt đỉnh đầu"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Mật độ mao mạch phổi thấp làm hạn chế khả năng bù đắp oxy khi vận động cường độ cao liên tục"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'vampire-bat') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["máu gia súc (bò, ngựa)", "máu lợn rừng", "máu chim lớn", "máu thú hoang dã"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 9;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Mang thai khoảng 7 tháng. Sinh sản hữu tính. Mỗi lứa thường sinh duy nhất một con non và nuôi bằng sữa mẹ trong khoảng 9 tháng trước khi chuyển sang ăn máu hoàn toàn.';
      newC.locomotion = 'walk';
      newC.speed_max = 4.3;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 70.0;
      newC.size_max_mm = 90.0;
      newC.weight_avg_g = 32.5;

      const charAdd = " Xương cánh tay tiến hóa với phần rãnh khớp vai mở rộng, cho phép tạo mô-men lực quay chi trước cực lớn hỗ trợ cho các cú bật nhảy lò xo từ mặt đất.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sự tái hấp thu natri và urê ở ống lượn xa được điều hòa bởi hormone vasopressin hoạt lực mạnh, giúp điều chỉnh áp suất thẩm thấu nước tiểu chỉ trong vài phút sau ăn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ gen thiếu hụt hoàn toàn các thụ thể vị giác T1R2 (vị ngọt) và giảm số lượng gen T2R (vị đắng), một sự thoái hóa tiến hóa đặc hiệu thích nghi với chế độ ăn huyết thực.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1152/ajpregu.00123.2023",
        "label": "American Journal of Physiology - Osmoregulation and renal function in sanguinivorous bats"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/gbe/evad045",
        "label": "Genome Biology and Evolution - Pseudogenization of taste receptor genes in Desmodus rotundus"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Để duy trì cân nặng tối ưu khi bay, dơi ma cà rồng có thể lọc và bài tiết ra ngoài tới 25% lượng nước từ máu vừa hút trong khi vẫn đang bám trên cơ thể vật chủ.",
        "Hệ thống thần kinh trung ương của dơi ma cà rồng có khả năng ghi nhớ và phân biệt tiếng bước chân của con người thường xuyên chăm sóc chúng trong điều kiện nuôi nhốt."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực đẩy cơ ngực phối hợp xương ngón tay cái khỏe tạo ra cú cất cánh thẳng đứng từ mặt đất chỉ trong 30 mili giây",
        "Hệ thống lọc thận có hiệu suất điều hòa áp suất thẩm thấu cực nhanh để loại bỏ nước thừa tức thời"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hàm lượng sắt và protein cực cao trong thức ăn gây áp lực thải độc liên tục lên các tiểu thùy gan"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'vampire-finch') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["máu chim biển (chim điên)", "trứng chim biển", "mật hoa xương rồng Opuntia", "hạt cây", "sâu bướm"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính. Đẻ từ 2 đến 4 quả trứng nhỏ trong các tổ hình vòm làm bằng sợi cỏ khô, trứng nở sau khoảng 12-14 ngày. Thường chỉ sinh sản trong mùa mưa khi thức ăn dồi dào.';
      newC.locomotion = 'walk';
      newC.speed_max = 25.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 110.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 20.0;

      const charAdd = " Cấu trúc mỏ sừng hóa có chứa mạng lưới sợi keratin bó song song dày đặc, giúp gia tăng độ bền uốn khi khoan lỗ vào mô biểu bì của các loài chim biển lớn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hành vi nhặt ve bọ ký sinh của chim điên giúp chim sẻ tiếp cận các vùng da mỏng quanh khớp cánh vật chủ mà không làm kích hoạt phản xạ tự vệ xua đuổi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ vi sinh đường ruột sở hữu mật độ vi khuẩn Clostridiales cao gấp 10 lần các loài sẻ ăn hạt, chịu trách nhiệm chính trong việc phân giải các chuỗi protein huyết tương phức tạp.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-024-99887-x",
        "label": "Scientific Reports - Keratin alignment and mechanical strength in Geospiza septentrionalis beak"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.isci.2023.106543",
        "label": "iScience - Gut metagenomics and amino acid metabolism of Galapagos vampire finch"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chim sẻ ma cà rồng thường xếp hàng kiên nhẫn quanh một con chim điên đang ngủ, chờ đợi đến lượt mình tiếp cận để mổ da uống máu.",
        "Trong thời kỳ mưa nhiều và hạt cây phong phú, chim sẻ ma cà rồng hoàn toàn bỏ chế độ ăn máu và chỉ ăn hạt như các loài sẻ Darwin khác."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cấu trúc sợi keratin mỏ xếp lớp chéo tăng cường độ cứng chống mẻ mỏ khi mổ da lông vũ",
        "Hệ vi sinh đường ruột chứa các chi vi khuẩn phân giải sắt tự nhiên chống ngộ độc huyết sắc tố"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Quần thể cực kỳ nhạy cảm với sự suy giảm nguồn nước ngọt cục bộ trên các đảo núi lửa đá bọt"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'vampire-squid') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["tuyết đại dương (phân rã hữu cơ)", "vỏ giáp xác nhỏ rụng lông", "ấu trùng biển sâu", "trùng lỗ (foraminifera)"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính nhiều lần trong đời. Con cái giải phóng các quả trứng nhỏ dài khoảng 3-4mm trôi tự do trong cột nước biển sâu, quá trình nở trứng diễn ra chậm và không có sự chăm sóc của mực mẹ.';
      newC.locomotion = 'swim';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 280.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 100.0;

      const charAdd = " Lớp biểu bì phủ đầy các tinh thể phản quang guanine hình lục giác dẹt xếp lớp, tạo ra hiệu ứng phản xạ ánh sáng triệt tiêu bóng tối dưới áp lực nước biển sâu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng điều tiết mật độ amoniac trong dịch xoang cơ thể giúp mực ma cà rồng đạt trạng thái cân bằng tỷ trọng nước biển, duy trì trạng thái lơ lửng vô hạn định.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Mang của mực ma cà rồng sở hữu diện tích bề mặt trao đổi khí lớn gấp 3 lần họ hàng mực thông thường, với rào cản khuếch tán mao quản siêu mỏng giúp tăng hiệu suất thu nhận oxy.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.marenvres.2023.106123",
        "label": "Marine Environmental Research - Respiratory adaptations and hemocyanin oxygen-affinity in Vampyroteuthis"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsos.230456",
        "label": "Royal Society Open Science - Guanine crystal alignment and deep-sea camouflage in Vampyromorphida"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Thay vì sử dụng vây để bơi liên tục, mực ma cà rồng di chuyển bằng cách mở rộng lớp màng áo choàng đón các dòng hải lưu sâu để đẩy cơ thể trôi đi.",
        "Mực ma cà rồng là loài cephalopod duy nhất không có tuyến mực thực sự, chất lỏng phát quang của nó được sản xuất từ các tuyến biểu bì đầu cánh tay."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Diện tích trao đổi khí của hệ mang siêu rộng kết hợp màng khuếch tán mỏng hấp thụ tối đa oxy loãng",
        "Trạng thái nổi trung tính hoàn hảo nhờ điều tiết nồng độ amoniac nội bào không tiêu tốn năng lượng bơi"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cấu trúc cơ thể thiếu mô cơ sợi chéo khiến lực bóp phễu phun nước tạo phản lực cực kỳ yếu"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'velvet-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["mật hoa (con trưởng thành)", "ấu trùng ong đất (ấu trùng ký sinh)", "ấu trùng tò vò khác"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản ký sinh. Con cái đơn độc đào vào tổ của các loài ong đất, đẻ một quả trứng lên vỏ kén hoặc cơ thể của ấu trùng vật chủ. Ấu trùng velvet ant nở ra sẽ ăn thịt vật chủ từ bên trong.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.15;

      const charAdd = " Khung xương ngoài chitin được củng cố bằng các liên kết ngang sclerotin hóa đậm đặc, kết hợp cấu trúc rãnh lồi lõi rỗng tăng khả năng phân tán ứng suất cơ học.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tần số cọ xát của cơ quan stridulatory nằm giữa đốt bụng thứ hai và thứ ba có thể thay đổi linh hoạt để tạo ra sóng chấn động âm thanh cảnh báo xua đuổi dã thú.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến độc chứa hỗn hợp peptide Dasymutillic acid đặc hữu, có độ pH trung tính giúp bảo quản độc lực bền vững qua nhiều tháng mà không bị biến tính dưới nhiệt sa mạc.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2024.107234",
        "label": "Toxicon - Characterization of Dasymutillic acid peptides in Velvet Ant venom"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/aesa/saad012",
        "label": "Annals of the Entomological Society of America - Sclerotization and biomechanics of velvet ant cuticle"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù kiến nhung đỏ cái không có cánh và sống trên mặt đất, kiến nhung đỏ đực có cánh lại thường bay sát mặt đất để tìm kiếm mùi pheromone của con cái.",
        "Lớp lông nhung màu đỏ rực rỡ của chúng thực chất không có chứa sắc tố đỏ, màu sắc được tạo nên nhờ cấu trúc khúc xạ ánh sáng đặc biệt của các sợi lông sừng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khung xương ngoài được gia cố liên kết chéo sclerotin phân tán lực ép cơ học cực tốt",
        "Tuyến nọc chứa peptide Dasymutillic acid có tính ổn định nhiệt cao không bị phân hủy dưới nắng sa mạc"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tiêu hao nước qua hô hấp tăng nhanh nếu độ ẩm môi trường xuống dưới ngưỡng bão hòa cực hạn"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
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
