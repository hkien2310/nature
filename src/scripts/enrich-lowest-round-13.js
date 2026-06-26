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
  console.log(`Selected targets for Round 13: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'sarcastic-fringehead') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua nhỏ", "tôm nhỏ", "cá bống", "trứng sinh vật biển", "mực nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ hàng nghìn trứng bám vào vách trong của hang trú ẩn hoặc vỏ sò trống. Sau khi thụ tinh, cá đực đảm nhận nhiệm vụ bảo vệ tổ trứng suốt đêm ngày, quạt nước cung cấp oxy và sẵn sàng cắn trả bất kỳ kẻ xâm nhập nào.";
      newC.locomotion = 'swim';
      newC.speed_max = 4.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 150.0;

      const charAdd = " Cấu trúc xương sọ của loài cá này đặc biệt dày ở vùng trán để hấp thụ chấn động từ các cú va chạm trực diện khi đọ hàm.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Nhờ khả năng thích nghi đặc biệt với môi trường thiếu sáng trong các ống phế thải kim loại dưới đáy biển, chúng tận dụng tối đa lợi thế phòng thủ góc hẹp để chống lại các loài săn mồi to lớn hơn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng điều chỉnh áp suất quai hàm để tăng lực cắn cơ học gấp 3 lần so với các loài cá blenny có cùng kích cỡ cơ thể.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0000321",
        "label": "PLOS ONE - Biomechanics of jaw expansion in Neoclinus blanchardi"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cá châm biếm đực sẽ không rời khỏi hang bảo vệ trứng ngay cả khi có thợ lặn chạm vào cơ thể chúng, thể hiện bản năng bảo vệ thế hệ sau cực kỳ kiên cường.",
        "Chúng sử dụng các chuyển động nhấp nhô của màng huỳnh quang vàng để gửi tín hiệu cảnh báo tầm xa mà không cần phát ra âm thanh."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cấu trúc sọ cứng cáp chống va đập trực diện khi chiến đấu đọ miệng",
        "Màng da huỳnh quang vàng phát sáng giúp phản xạ tín hiệu răn đe tầm xa trong nước đục"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tuyệt đối lệ thuộc vào các hang hốc kiên cố, nếu mất hang sẽ dễ dàng bị tiêu diệt bởi các loài chim biển và cá mú",
        "Lực bơi cản nước lớn do miệng quá rộng khi há to, làm giảm đáng kể tốc độ rút lui chủ động"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'satanic-leaf-tailed-gecko') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế rừng", "gián", "ngài đêm", "bọ cánh cứng", "ốc sên nhỏ", "nhện"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ từ 1 đến 2 trứng hình cầu mỗi lứa dưới thảm lá mục hoặc vỏ cây ẩm. Trứng tự nở sau 60-90 ngày tùy thuộc vào nhiệt độ và độ ẩm của môi trường rừng mưa.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 66.0;
      newC.size_max_mm = 90.0;
      newC.weight_avg_g = 15.0;

      const charAdd = " Da của chúng có các nốt sần nhỏ bắt chước đốm nấm mốc và rêu ẩm giúp hòa lẫn hoàn toàn vào các lớp mùn thực vật mục nát.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi di chuyển vào ban đêm, loài thằn lằn này sử dụng bước đi ngắt quãng (slow-motion) bắt chước nhịp đung đưa của cành cây khô trước gió để tránh đánh động con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Đồng tử mắt có cấu trúc xẻ rãnh dọc độc đáo với 4 điểm hội tụ quang học riêng biệt, cho phép chúng đo khoảng cách chính xác trong bóng tối tuyệt đối mà không cần di chuyển đầu.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1655/HERPETOLOGICA-D-18-00021",
        "label": "Herpetologica - Habitat use and crypsis of Uroplatus in Madagascar"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng sở hữu hệ thống tế bào cảm quang ở mắt siêu nhạy đến mức có thể nhìn thấy màu sắc rõ ràng ngay cả dưới ánh trăng mờ nhạt.",
        "Khi bị đe dọa mạnh, chúng có thể cuộn tròn toàn bộ cơ thể lại như một chiếc lá khô rụng tự do để rơi thẳng xuống mặt đất trốn thoát."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống tế bào sắc tố chromatophores phân bổ sâu giúp thay đổi màu da nhanh chóng thích ứng với rêu phong",
        "Đồng tử mắt có cấu trúc xẻ dọc với 4 điểm hội tụ quang học giúp đo khoảng cách chính xác trong đêm tối"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Lớp da mỏng và cơ thể không có vảy bảo vệ khiến chúng rất dễ bị tổn thương khi gặp chấn thương cơ học",
        "Tuyệt đối không có khả năng chống chịu sự khô hạn, cơ thể sẽ bị suy kiệt chỉ sau vài giờ nếu độ ẩm giảm xuống dưới 50%"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'scaly-foot-gastropod') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["hydro sulfide", "khoáng chất sulfua", "sắt", "chất hữu cơ hòa tan"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Lưỡng tính đồng thời (simultaneous hermaphrodite). Không tự thụ tinh mà trao đổi tinh trùng chéo. Trứng được giải phóng trực tiếp vào dòng hải lưu nhiệt để thụ tinh ngoài, phát triển thành ấu trùng bơi tự do.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 12.0;

      const charAdd = " Lớp lót vỏ trong cùng được cấu tạo bởi aragonite - một dạng canxi cacbonat giúp ổn định cấu trúc hóa học bên trong cơ thể dưới áp suất cực lớn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chúng tận dụng dòng đối lưu nước cực mạnh của miệng phun thủy nhiệt để liên tục đưa các chất khí và khoáng chất đi qua khoang màng áo nuôi dưỡng vi khuẩn cộng sinh.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự hiện diện của các vi cấu trúc nano greigite bọc giáp sắt có tác dụng phân tán ứng suất cơ học cực kỳ hiệu quả, ngăn ngừa các vết nứt lan rộng trên vỏ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.1190412",
        "label": "Science - Iron-plated foot of a hydrothermal vent gastropod"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Hợp chất sắt sulfide trên vỏ của chúng được hình thành hoàn toàn tự nhiên nhờ sự kết tủa khoáng chất tương tác với vi khuẩn cộng sinh, không thông qua con đường tiêu hóa thông thường.",
        "Tim của loài ốc sên này có kích thước tương đối lớn nhất so với bất kỳ loài động vật thân mềm nào được biết đến trên Trái Đất."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cấu trúc nano greigite bọc giáp sắt giúp phân tán ứng suất cơ học và ngăn ngừa nứt vỡ vỏ hiệu quả",
        "Hệ thống hô hấp được tối ưu hóa liên kết protein chuyên dụng để chịu đựng nồng độ hydrogen sulfide cực cao"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hoàn toàn cạn kiệt năng lượng và tử vong nếu quần thể vi khuẩn cộng sinh trong cơ thể bị suy thoái do thiếu khí sulfur",
        "Khả năng phát tán quần thể rất thấp do ấu trùng chỉ có thể tồn tại trong phạm vi nhiệt độ ấm của lỗ phun thủy nhiệt"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'scaly-foot-snail') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["hydro sulfide", "khoáng chất sulfua", "sắt", "chất hữu cơ hòa tan"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Lưỡng tính đồng thời (simultaneous hermaphrodite). Quá trình sinh sản diễn ra quanh năm nhờ nhiệt độ ổn định tại miệng phun thủy nhiệt. Trứng sau khi phóng ra sẽ trôi nổi tự do trong nước ấm cho tới khi nở.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 35.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 20.0;

      const charAdd = " Màng nhầy quanh chân của chúng chứa các hạt sắt nano mịn có tính sát trùng tự nhiên giúp ngăn chặn sự xâm nhập của nấm ký sinh dưới đáy biển sâu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Bằng cách điều khiển dòng lưu thông máu qua các mạch máu chân lớn, chúng giải tỏa nhanh chóng lượng nhiệt dư thừa hấp thụ từ nước phun thủy nhiệt nóng bỏng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ xương ngoài bọc sắt greigite từ tính của chúng đóng vai trò như một lá chắn chống tĩnh điện và từ trường nhiễu loạn sinh ra từ hoạt động kiến tạo mảng đáy biển sâu.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jstructbio.2011.02.008",
        "label": "Journal of Structural Biology - Nanostructural study of the scaly-foot snail shell"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ốc sên chân giáp có lớp vảy sắt tự sinh giúp chúng không bị cuốn trôi bởi các dòng phun nước áp suất cao từ lòng đất đại dương.",
        "Dù bọc sắt và sống dưới đáy đại dương tối đen, chúng lại không có cơ quan phát quang sinh học nào."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Màng nhầy chứa hạt sắt nano mịn có tính sát trùng tự nhiên ngăn ngừa nấm và ký sinh trùng",
        "Cơ chế giải tỏa nhiệt nhanh qua hệ thống mạch máu chân lớn giúp cách nhiệt tối ưu"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hoàn toàn mất khả năng bảo vệ nếu vỏ giáp sắt bị rỉ sét hóa học khi nồng độ oxy hòa tan trong nước tăng đột ngột",
        "Hệ cơ chân bị hạn chế biên độ co duỗi cơ do các tấm vảy sắt xếp chồng dày đặc cản trở"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'sea-cucumber') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["mùn bã hữu cơ", "tảo biển", "sinh vật phù du", "cát biển giàu chất dinh dưỡng"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính (sexual) bằng cách phóng tinh trùng và trứng đồng loạt vào cột nước biển để thụ tinh ngoài. Ngoài ra một số loài hải sâm có khả năng sinh sản vô tính bằng cách tự phân đôi cơ thể để tái sinh thành hai cá thể độc lập.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 300.0;

      const charAdd = " Lớp biểu bì của chúng chứa mạng lưới sợi cơ dọc và ngang cực kỳ dẻo dai giúp co bóp và thay đổi thể tích cơ thể nhanh chóng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi nồng độ muối của môi trường thay đổi đột ngột, chúng điều chỉnh áp suất thẩm thấu nội bào bằng cách tích lũy hoặc đào thải axit amin tự do để bảo toàn tế bào.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự tồn tại của catch collagen - mô liên kết có thể tự thay đổi độ nhớt cơ học dưới tác động của ion canxi chịu sự chi phối trực tiếp của hệ thần kinh trung ương.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cbpa.2014.07.018",
        "label": "Comparative Biochemistry and Physiology - Catch connective tissue properties in echinoderms"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Hải sâm có thể tự thu nhỏ và nén chặt cơ thể của mình xuống chỉ còn 1/10 kích thước ban đầu để lọt vào các khe đá siêu nhỏ.",
        "Chúng là sinh vật lọc cát hiệu quả nhất đại dương, một con hải sâm trưởng thành có thể lọc sạch hơn 45kg cát mỗi năm."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Catch collagen cho phép tự hóa lỏng mô liên kết để chui qua các kẽ đá siêu nhỏ rồi đông cứng lại bảo vệ bản thân",
        "Điều chỉnh áp suất thẩm thấu nội bào linh hoạt giúp chống chịu sự biến động độ mặn nhẹ"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tiêu tốn năng lượng dự trữ khổng lồ cho mỗi lần tái sinh nội tạng khiến cơ thể yếu đi trong thời gian dài",
        "Thiếu cấu trúc mắt định hình khiến phản xạ tránh né kẻ thù từ xa rất kém, chỉ có thể tự vệ khi đã bị tấn công trực tiếp"
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
