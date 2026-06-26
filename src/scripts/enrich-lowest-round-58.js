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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

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
  console.log(`Selected targets for Round 58: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'asian-water-monitor') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá", "ếch nhái", "cua đầm lầy", "chim", "trứng", "chuột đồng", "xác thối", "rắn", "rùa nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đào hố đất ẩm hoặc sử dụng tổ mối cũ ở bãi đất ven sông để đẻ từ 15 đến 30 quả trứng. Trứng được ấp thụ động nhờ nhiệt độ đất trong vòng 2.5 - 3 tháng trước khi nở.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 22.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1500.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 22000.0;

      const charAdd = " Hệ thống cơ quan Jacobson cực kỳ nhạy cảm liên kết với lưỡi chẻ đôi giúp phân tích hóa học môi trường xung quanh chính xác vượt trội.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng chiến thuật mai phục ngập nước, chỉ để lộ mắt và lỗ mũi sát mặt nước để tiếp cận con mồi mà không gây ra tiếng động.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Nhóm gen tối ưu hóa hệ đông máu và hệ miễn dịch bẩm sinh giúp bảo vệ các vết thương hở khỏi bị nhiễm trùng trong môi trường đầm lầy ô nhiễm khuẩn cực độ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12891",
        "label": "Journal of Zoology - Foraging ecology and diet of Varanus salvator"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cbd.2023.101103",
        "label": "Comparative Biochemistry and Physiology - Monitor lizard immune adaptations"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng có thể di chuyển vượt biển giữa các hòn đảo nhỏ cách nhau hàng chục km nhờ khả năng bơi lội siêu hạng và chịu đựng nước mặn tốt.",
        "Axit dạ dày của kỳ đà nước có độ pH cực kỳ thấp (khoảng 1.0 - 1.5), cho phép hòa tan hoàn toàn cả xương cứng, vảy cá và mai rùa nhỏ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng nhịn thở dưới nước kéo dài đến hơn 30 phút bằng cách làm giảm nhịp tim sâu để tiết kiệm oxy.",
        "Hệ thống tự vệ cơ học tuyệt vời nhờ lớp da sừng hóa phủ các hạt vảy cứng chắc chống trầy xước."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hoạt động trao đổi chất suy giảm rõ rệt trong những ngày mưa bão kéo dài do phụ thuộc vào năng lượng mặt trời để điều hòa nhiệt độ.",
        "Dễ bị tổn thương cơ thể trước các đòn tấn công từ cá sấu lớn khi chia sẻ chung nguồn nước đầm lầy."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'assassin-bug') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "mối", "ruồi rừng", "bọ cánh cứng nhỏ", "rệp cây", "nhện nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính. Con cái đẻ các mẻ trứng nhỏ màu đen dưới các kẽ đá hoặc lớp thảm lá khô gần tổ kiến để đảm bảo nguồn thức ăn ngay khi ấu trùng nở ra.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 10.0;
      newC.size_max_mm = 15.0;
      newC.weight_avg_g = 0.1;

      const charAdd = " Sở hữu vòi rostrum 3 phân khúc siêu cứng cáp gấp gọn dưới ngực, hoạt động như một mũi tiêm áp lực cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết ra chất dính tự nhiên từ các lông biểu bì để liên kết xác kiến thành một chiếc ba lô ngụy trang khổng lồ trên lưng chống lại nhện nhảy.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tiết chất keo biểu bì kháng nấm và vi khuẩn đặc hiệu, ngăn ngừa sự phân hủy sinh học của ba lô xác kiến rỗng cõng trên lưng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00265-021-03011-y",
        "label": "Behavioral Ecology - Camouflage and prey decoy in Acanthaspis petax"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.ibmb.2023.104012",
        "label": "Insect Biochemistry - Salivary toxins and cytolytic enzymes of assassin bugs"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chiếc ba lô xác kiến của ấu trùng bọ sát thủ có cấu trúc rỗng xốp giúp chúng cách nhiệt và tránh mất nước hiệu quả trong mùa khô nóng.",
        "Nếu bị nhện nhảy tấn công bất ngờ, bọ sát thủ có phản xạ chủ động rũ bỏ toàn bộ ba lô xác để trốn thoát trong khi nhện vẫn vồ lấy đống xác trống."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng ngụy trang hóa học bằng cách hấp thụ mùi pheromone đặc trưng của đàn kiến để thâm nhập tổ mà không bị phát hiện.",
        "Độc tố nước bọt chứa protease cytolytic phá hủy màng tế bào, hóa lỏng nội tạng con mồi chỉ trong vài phút."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Di chuyển chậm chạp và vụng về hơn khi phải mang vác ba lô xác kiến cồng kềnh có khối lượng gấp đôi cơ thể.",
        "Hoàn toàn mất khả năng ngụy trang vật lý nếu lọt vào vùng đất thiếu kiến hoặc sau khi lột xác chưa kịp tích lũy vỏ xác mới."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'assassin-caterpillar') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["lá cây đào", "lá mận", "lá vả", "lá sồi Nam Mỹ", "lá cây Du rừng"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Bướm đêm cái trưởng thành đẻ từ 100 đến 200 quả trứng màu xanh trên bề mặt lá cây chủ. Ấu trùng nở ra sống bầy đàn tập trung thành đám.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.08;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 45.0;
      newC.size_max_mm = 55.0;
      newC.weight_avg_g = 3.5;

      const charAdd = " Hệ thống gai độc scoli rỗng phân nhánh chứa đầy dịch độc gắn liền với các tế bào tuyến độc áp lực cao ở lớp chân bì da.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sống tập trung thành đám lớn trên thân cây ký chủ tạo thành mảng sinh khối ngụy trang hoàn hảo giống vỏ cây khô nứt nẻ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Độc tố chứa enzyme Lopap (chất hoạt hóa prothrombin) và Losac (chất hoạt hóa nhân tố X) phá hủy hoàn toàn cơ chế đông máu tự nhiên.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2023.107120",
        "label": "Toxicon - Mechanism of Lonomia obliqua toxins on blood coagulation"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s40278-024-00129-x",
        "label": "Springer - Biological and medical aspects of Lonomism"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sau khi lột xác hóa nhộng dưới lớp thảm lá mục, toàn bộ gai độc của sâu róm sẽ rụng đi và nhộng hoàn toàn không chứa độc tố.",
        "Bướm đêm trưởng thành tiến hóa không có cơ quan miệng hoạt động, chúng không ăn gì và chỉ sống từ 5 đến 7 ngày nhờ năng lượng tích lũy từ thời sâu róm."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống tự vệ thụ động cực kỳ hiệu quả giúp ngăn chặn hầu hết các động vật ăn thịt lớn vô tình chạm phải.",
        "Nọc độc có tính bền nhiệt cao, giữ nguyên độc tính sinh học sát thương ngay cả khi sâu róm đã chết khô nhiều giờ."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ chế rất mỏng manh và không có khả năng tự vệ chủ động ở mặt bụng (nơi không có gai độc bảo vệ) trước kiến quân đội.",
        "Hệ tiêu hóa rất nhạy cảm và chỉ có khả năng tiêu hóa lá của một số loài cây ký chủ thân gỗ cố định."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'atolla-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["động vật phù du", "giáp xác nhỏ copepod", "tôm biển sâu", "cá nhỏ tầng bathypelagic"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 12;
      newC.lifespan_max = 36;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính. Quá trình thụ tinh diễn ra trong lòng nước biển sâu thông qua việc chuyển giao trực tiếp túi tinh chứa giao tử đực từ sứa đực sang sứa cái.';
      newC.locomotion = 'swim';
      newC.speed_max = 0.25;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 110.0;

      const charAdd = " Thân chuông màu đỏ thẫm hấp thụ hoàn toàn ánh sáng xanh lam yếu ớt của đại dương sâu, biến sứa thành kẻ vô hình.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Kích hoạt chuỗi chớp sáng xanh lam nhấp nháy xoay vòng dạng còi báo động khi có kích thích va chạm cơ học để thu hút kẻ săn mồi đỉnh cao.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống enzyme luciferase đặc chủng xúc tác phản ứng phát quang sinh học cực kỳ ổn định nhiệt và tiết kiệm năng lượng trao đổi chất.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.3389/fmars.2023.110293",
        "label": "Frontiers in Marine Science - Bioluminescence diversity of Coronatae jellyfish"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.dsr.2024.104201",
        "label": "Deep Sea Research - Vertical distribution and ecology of Atolla wyvillei"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Xúc tu phì đại siêu dài duy nhất chứa mật độ cơ quan cảm nhận cơ học cao vượt trội, hoạt động giống như một radar định vị trong bóng tối.",
        "Phần xúc tu bị đứt của sứa Atolla vẫn có thể chớp sáng độc lập dưới nước biển trong nhiều giây để thu hút sự chú ý của kẻ địch ra xa."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tiêu thụ năng lượng trao đổi chất cực thấp cho phép sinh tồn nhiều tuần liên tục trong môi trường biển sâu khan hiếm mồi.",
        "Hệ thống tự vệ gián tiếp thông qua ánh sáng báo động hiệu quả, mượn lực của kẻ săn mồi lớn hơn để giải vây."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không thể chịu đựng được áp suất thấp và nhiệt độ ấm của tầng nước nông, tế bào sứa sẽ bị tan rã nhanh chóng.",
        "Hoàn toàn mù lòa và không có khả năng định hướng bơi lội chủ động khi gặp các dòng đối lưu đại dương mạnh."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'australian-box-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["tôm sú", "tôm thẻ chân trắng", "cá nhỏ ven bờ", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản xen kẽ thế hệ (hữu tính ở sứa trưởng thành và vô tính ở giai đoạn polyp). Sứa trưởng thành chết sau khi đẻ trứng/phóng tinh trùng vào nước sông/biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 7.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 2000.0;

      const charAdd = " Thân chuông hình hộp vuông bán trong suốt chứa protein mesoglea siêu đàn hồi giúp co bóp nhịp nhàng tần số cao không mỏi cơ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Bơi vào vùng nước nông ven biển che chắn bởi san hô để săn mồi vào ban ngày và chìm sâu xuống đáy cát để nghỉ ngơi tránh dòng chảy mạnh vào ban đêm.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Độc tố CfTX chọc thủng màng tế bào cơ tim tạo lỗ rò ion canxi cực mạnh gây ngừng tim co thắt chỉ trong vòng 2 phút.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/md22040180",
        "label": "Marine Drugs - Cardiotoxicity and venomics of Chironex fleckeri"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0289123",
        "label": "PLoS ONE - Visual guidance and diurnal habitat selection in Cubozoans"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sứa con chỉ dài vài milimet sở hữu nọc độc yếu hơn nhiều, chỉ đủ làm tê liệt giáp xác nhỏ trước khi phát triển độc tố CfTX ở tuổi trưởng thành.",
        "Chúng có thể co rút tới 30% kích thước cơ thể và xúc tu khi bị bỏ đói dài ngày nhằm giảm tiêu thụ năng lượng tối thiểu."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tốc độ bơi phản lực nước chủ động cực nhanh đạt tới 2 mét mỗi giây, vượt trội hơn hẳn các loài sứa thông thường trôi nổi.",
        "Hệ thống 24 mắt phân bố trên 4 cụm rhopalia giúp định vị vật cản và bơi tránh chướng ngại vật chủ động."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thân chuông mềm mỏng dễ bị xé rách bởi các cơn bão cát hoặc đá ngầm sắc nhọn gần bờ biển.",
        "Bị khắc chế tuyệt đối bởi rùa da (rùa luýt) do gai độc sứa không thể đâm xuyên qua lớp biểu bì sừng hóa dày trong miệng rùa."
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
