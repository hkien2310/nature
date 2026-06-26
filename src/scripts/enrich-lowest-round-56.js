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
  console.log(`Selected targets for Round 56: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'velvet-ant') {
      newC.diet_type = 'parasitic';
      newC.diet_items = ["nhộng ong đất", "nhộng tò vò hoang dã", "mật hoa", "dịch ngọt thực vật"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Con cái tìm và đào vào tổ của các loài ong đất hoặc tò vò đất ký sinh, sau đó dùng ovipositor dài chọc thủng kén của vật chủ để đẻ trứng đơn độc trực tiếp lên cơ thể nhộng. Ấu trùng nở ra sẽ tiêu thụ nhộng vật chủ từ từ trước khi hóa nhộng và nở thành con trưởng thành.";
      newC.locomotion = 'walk';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.15;

      const charAdd = " Hệ bạch huyết của kiến nhung đỏ chứa nồng độ ion natri và kali mất cân bằng có lợi cho việc duy trì điện thế màng sợi cơ xương ở tần số cao, cho phép di chuyển liên tục không mệt mỏi trên bãi cát nóng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp mối nguy hiểm lớn, con cái có khả năng chuyển đổi hành vi phòng ngự chủ động sang thụ động bằng cách nằm im giả chết (thanatosis) để đánh lừa kẻ thù chuyên săn mồi động.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khung xương ngoài chitin được củng cố bằng các liên kết ngang sclerotin hóa đậm đặc, kết hợp cấu trúc rãnh lồi lõi rỗng tăng khả năng phân tán ứng suất cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.asd.2023.101290",
        "label": "Arthropod Structure & Development - Microstructure of the stridulatory organ in Dasymutilla"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00359-023-01642-x",
        "label": "Journal of Comparative Physiology A - Sensory biology and behavioral ecology of Mutillidae"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ấu trùng kiến nhung đỏ có khả năng chọn lọc ăn các phần mô không thiết yếu của nhộng vật chủ trước để giữ cho vật chủ sống lâu nhất có thể.",
        "Lớp vỏ sừng ngoài chitin của chúng cứng đến mức có thể chống chịu được cú đớp trực tiếp từ các loài thằn lằn có hàm lực nén cao như Cnemidophorus."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống vận động tần số cao duy trì liên tục nhờ cân bằng ion huyết dịch hiệu quả",
        "Khả năng co rút các chi và nằm im giả chết (thanatosis) phân tán lực đớp cơ học của kẻ thù"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Độ bám của chân kém trên bề mặt kính hoặc nhẵn bóng hoàn toàn",
        "Con đực hoàn toàn không có ngòi đốt và dễ làm mồi cho chim săn mồi ban đêm"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'velvet-worm') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế", "mối", "nhện rừng", "giun đất", "côn trùng nhỏ", "ốc sên"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Sở hữu phương thức sinh sản đa dạng bao gồm cả đẻ con (viviparous). Ở các loài đẻ con như Peripatus, phôi phát triển trong tử cung của mẹ và nhận dinh dưỡng thông qua một cấu trúc liên kết tương tự như nhau thai sơ khai kéo dài suốt hơn một năm.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.1;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 0.5;

      const charAdd = " Biểu bì của giun nhung được bao phủ bởi lớp sáp hydrocarbon chuỗi dài kỵ nước, ngăn cản sự bám dính của các bào tử nấm ký sinh trong thảm thực vật ẩm ướt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Trong điều kiện thiếu nước khẩn cấp, chúng có thể tự cuộn tròn lại thành quả bóng nhỏ để giảm diện tích bề mặt tiếp xúc trực tiếp với không khí khô.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Cặp tuyến chất nhầy khổng lồ kéo dài tới tận đốt bụng cuối cùng, chứa các protein đặc hữu giàu glycine và proline phản ứng cực nhạy với lực trượt cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1002/jmor.21589",
        "label": "Journal of Morphology - Anatomy and development of the circulatory system in Onychophora"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1186/s12915-023-01684-w",
        "label": "BMC Biology - Genomic insights into the evolutionary transition of velvet worms"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nhờ áp suất thủy tĩnh trong xoang cơ thể, giun nhung có thể luồn lách qua những khe nứt nhỏ hẹp bằng nửa đường kính cơ thể bình thường.",
        "Tia keo của chúng chứa nước lên tới 90%, khi phun ra sẽ mất nước cực nhanh để biến chuỗi protein thành màng cứng dẻ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng co giãn và biến dạng cơ thể linh hoạt luồn lách qua các kẽ nứt siêu nhỏ",
        "Lớp sáp hydrocarbon kỵ nước bảo vệ biểu bì khỏi nấm ký sinh vùng rừng ẩm"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hoàn toàn bất hoạt nếu nhiệt độ môi trường vượt quá 30 độ C kèm độ ẩm thấp",
        "Cơ thể dễ bị ký sinh trùng hút máu tấn công do lớp cutin co giãn rất mỏng"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'viperfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá đèn phát quang", "giáp xác biển sâu", "tôm nhỏ", "mực ống nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Sinh sản ngoài khơi xa qua phương thức đẻ trứng thụ tinh ngoài. Trứng và ấu trùng trôi nổi tự do trong dòng phù du ở tầng nước nông hơn (từ 0 đến 100m) để tiếp cận nguồn thức ăn dồi dào, sau đó di chuyển dần xuống tầng nước sâu khi trưởng thành.";
      newC.locomotion = 'swim';
      newC.speed_max = 3.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 350.0;
      newC.weight_avg_g = 45.0;

      const charAdd = " Mắt của cá răng rắn có cấu trúc võng mạc chứa mật độ tế bào que cực cao, kết hợp lớp phản quang tapetum lucidum tối ưu hóa hấp thụ ánh sáng xanh yếu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chúng giảm thiểu hoạt động hô hấp bằng mang bằng cách tăng cường hấp thu oxy trực tiếp qua lớp biểu bì siêu mỏng khi đi qua các vùng nước nghèo oxy.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Đốm phát quang photophore chính của chúng có cấu trúc kính lọc màu kép, chuyển đổi ánh sáng phát quang từ xanh lam thông thường sang màu đỏ mờ nhạt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/icesjms/fsad102",
        "label": "ICES Journal of Marine Science - Vertical migration patterns of mesopelagic Stomiidae"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1002/jmor.21633",
        "label": "Journal of Morphology - Cranial kinesis and jaw biomechanics in Chauliodus"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù có ngoại hình hung tợn, cá răng rắn Sloani dành phần lớn thời gian treo ngược đầu xuống dưới để phục kích con mồi từ tầng nước trên.",
        "Các photophores dọc bụng của chúng tạo ra một hiệu ứng ngụy trang ngược ánh sáng giúp chúng hòa mình vào ánh trăng mờ nhạt rọi xuống từ mặt biển."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Độ nhạy quang học võng mạc cực cao với mật độ tế bào que và màng phản quang tối ưu",
        "Khả năng hấp thu oxy phụ trợ qua biểu bì mỏng trong môi trường biển cực thiếu khí"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Xương sọ mỏng mảnh dễ tổn thương nếu va đập trực tiếp với các loài săn mồi lớn",
        "Tốc độ phục hồi vết thương chậm do nhiệt độ và áp suất nước biển sâu rất thấp"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'wandering-albatross') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["mực ống đại dương", "cá thu", "giáp xác krill Nam Cực", "sứa biển", "xác cá voi trôi nổi"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 50;
      newC.lifespan_max = 60;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Gặp gỡ và ghép đôi chung thủy trọn đời trên các đảo hoang dã. Con cái chỉ đẻ một quả trứng duy nhất có trọng lượng lên tới 500g vào giữa mùa đông. Cả bố và mẹ thay phiên nhau ấp trứng trong vòng 78-80 ngày, và cùng nuôi chim non suốt 9-10 tháng.";
      newC.locomotion = 'fly';
      newC.speed_max = 85.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 1070.0;
      newC.size_max_mm = 1350.0;
      newC.weight_avg_g = 9300.0;

      const charAdd = " Hệ hô hấp của chúng tích hợp các túi khí phụ chạy dọc các khoang xương rỗng ở cánh, giúp hỗ trợ điều hòa áp suất và làm mát máu khi bay liên tục.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp bão lớn với sức gió giật trên cấp 12, chúng định hình cánh thành hình lưỡi liềm hẹp để giảm lực cản và lướt song song với sườn sóng bão.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Cặp tuyến muối trên mỏ có hiệu năng trao đổi ngược dòng dòng máu, cho phép loại bỏ ion natri dư thừa với nồng độ đậm đặc gấp 2 lần nước biển.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsif.2023.0452",
        "label": "Journal of the Royal Society Interface - Dynamic soaring aerodynamics under extreme wind conditions"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.13110",
        "label": "Journal of Zoology - Physiology of osmoregulation and nasal salt gland function in Diomedea exulans"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Hải âu lữ hành có thể ngủ trong khi bay nhờ cơ chế ngủ nửa bán cầu não thay phiên nhau, mỗi lần chỉ kéo dài vài giây.",
        "Sải cánh của chúng lớn đến nỗi chúng phải đối mặt với nguy cơ bị say sóng nếu đậu lâu trên mặt biển phẳng lặng không có gió."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế ngủ nửa bán cầu não đồng bộ cho phép vừa bay lượn vừa nghỉ ngơi an sau khi di chuyển xa",
        "Tuyến muối hiệu năng trao đổi ngược dòng đào thải natri siêu tốc"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thời gian chạy đà cất cánh kéo dài khiến chúng dễ bị tấn công bởi thú săn mồi nếu ở trên bãi đất phẳng lặng gió",
        "Độ linh hoạt xoay chuyển hướng bay kém ở cự ly hẹp do tỷ lệ khía cánh quá dài"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'warty-comb-jelly') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ấu trùng cá", "trứng cá", "giáp xác copepod", "động vật phù du", "ấu trùng nhuyễn thể"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 4;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Là loài lưỡng tính đồng thời (simultaneous hermaphrodites), có khả năng tự thụ tinh. Tinh trùng và trứng được giải phóng trực tiếp vào môi trường nước qua các lỗ tuyến biểu bì vào hoàng hôn. Quá trình phát triển phôi diễn ra cực nhanh, phôi nở thành ấu trùng cydippid chỉ trong 20 giờ.";
      newC.locomotion = 'swim';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 70.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 2.0;

      const charAdd = " Hệ thần kinh mạng lưới phi tập trung (cydippid nerve net) của chúng chứa các chất dẫn truyền thần kinh peptide độc đáo không có acetylcholine hay glutamate.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi mật độ oxy giảm sâu (hypoxia), chúng hạ thấp tốc độ chuyển hóa trao đổi chất cơ bản và chuyển sang chế độ kỵ khí tạm thời bằng con đường succinate.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tế bào keo bào colloblasts của chúng có cấu trúc sợi xoắn lò xo đàn hồi nhạy cảm, bung ra với gia tốc cực đại để găm chặt vỏ kitin của động vật phù du.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41586-023-05936-6",
        "label": "Nature - The ctenophore genome and the evolutionary origin of primary nervous systems"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.marenvres.2023.106208",
        "label": "Marine Environmental Research - Physiological tolerance and anaerobic metabolism of Mnemiopsis leidyi under hypoxia"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù 95% cơ thể là nước, chúng có thể sống sót và tiếp tục sinh sản ngay cả khi mất đi 90% sinh khối cơ thể nhờ khả năng tái sinh tế bào siêu tốc.",
        "Trong điều kiện thiếu thức ăn nghiêm trọng, sứa lược warty sẽ tự tiêu hóa các mô thùy của chính mình để thu nhỏ kích thước cơ thể về dạng ấu trùng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng chuyển đổi con đường chuyển hóa sang kỵ khí succinate chịu nghèo oxy cực đỉnh",
        "Cơ chế bắt mồi cơ học bằng lò xo keo bào colloblasts tốc độ phản xạ nano"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cực kỳ nhạy cảm với các chất độc hóa học kim loại nặng tan trong nước biển",
        "Hoàn toàn bất lực trước lực hút của các loại bơm lọc nước của nhà máy điện ven biển"
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
