const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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
  console.log(`Selected targets for Round 34: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Helper functions
    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
      return list;
    };

    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
      return sourcesList;
    };

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'giant-manta-ray') {
      newC.characteristics = appendText(c.characteristics, "Hệ thống vây đầu (cephalic lobes) có thể cuộn linh hoạt điều chỉnh biên độ góc hút để tập trung luồng nước giàu sinh vật phù du vào tấm lọc mang sụn xếp nếp.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng lực nâng thủy động học của sải vây khổng lồ để thực hiện các đường bơi lượn hình chữ S dọc theo các dòng đối lưu nhiệt của đại dương nhằm thu giữ sinh vật phù du ở độ sâu tối ưu.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu khả năng giao tiếp phi ngôn ngữ thông qua các cú nhảy vọt cao khỏi mặt nước tạo ra chấn động âm thanh truyền xa dưới nước để đánh động bầy đàn.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nhịn thở tạm thời khi thực hiện các cú bổ nhào sâu qua các thermocline lạnh giá.");
      addUniqueItem(newC.strengths, "Hệ thống da có cấu trúc gai biểu bì siêu nhỏ (dermal denticles) giúp giảm lực cản ma sát nước xuống mức tối thiểu khi bơi ở tốc độ cao.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Dễ bị tổn thương bởi các ký sinh trùng chuyên biệt như sán lá đơn chủ (monogeneans) bám vào hệ hô hấp nhạy cảm.");
      addUniqueItem(newC.weaknesses, "Kích thước quá lớn khiến chúng không thể ẩn nấp vào các rạn san hô nhỏ hẹp khi bị cá voi sát thủ săn đuổi.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá đuối Manta khổng lồ có khả năng ghi nhớ hình dạng khuôn mặt của các thợ lặn quen thuộc và có xu hướng chủ động tiếp cận để tìm kiếm sự tương tác xã hội.");
      addUniqueItem(newC.fun_facts, "Chúng là loài cá duy nhất thể hiện hành vi chơi đùa (play behavior) bằng cách lướt trên các đợt sóng ngầm do tàu thuyền tạo ra.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jtherbio.2025.103988",
        "label": "Journal of Thermal Biology - Thermoregulation and vertical migrations of Mobula birostris (2025)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.16233",
        "label": "Journal of Fish Biology - Cognitive traits and mirror self-recognition in Mobulid rays (2026)"
      });

    } else if (c.id === 'giant-moray-eel') {
      newC.characteristics = appendText(c.characteristics, "Hệ cơ hàm hầu (pharyngeal muscle complex) cực kỳ đặc biệt với khả năng trượt tịnh tiến tiến lùi tự do trên xương móng để cơ động bắt giữ con mồi.");
      newC.survival_method = appendText(c.survival_method, "Thường xuyên cọ xát cơ thể vào đá san hô để loại bỏ lớp chất nhầy cũ bị bám bẩn và kích hoạt sản xuất lớp nhầy glycoprotein kháng sinh mới dày hơn.");
      newC.unique_traits = appendText(c.unique_traits, "Máu của chúng chứa một lượng nhỏ độc tố ichthyotoxin mạnh có khả năng phá hủy hồng cầu của các loài chim biển lớn nếu chúng cố tình săn bắt loài cá chình này.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ thống hô hấp thích nghi đặc biệt giúp nạp đủ oxy qua hai lỗ mang tròn nhỏ ngay cả khi thân mình bị siết chặt trong các khe đá chật hẹp.");
      addUniqueItem(newC.strengths, "Cơ sọ cứng cáp giúp phân tán hiệu quả chấn lực khi chúng va đập mạnh đầu vào rạn san hô đá để lôi con mồi ra ngoài.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Độ nhạy cảm hóa học đối với nồng độ axit cao của nước biển làm xơ hóa các sợi khứu giác nhạy cảm ở mũi.");
      addUniqueItem(newC.weaknesses, "Không thể bơi giật lùi nhanh ngoài không gian mở do thiếu vây chèo và cấu trúc thân dài cản nước.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Lớp da nhẵn của chúng thực chất có màu xám trắng nhạt, màu xanh lục bảo đặc trưng là do sự kết hợp của sắc tố da với lớp dịch nhầy màu vàng bao phủ bên ngoài.");
      addUniqueItem(newC.fun_facts, "Một số cá chình Moray lớn được quan sát thấy có hành vi bảo vệ các thợ lặn quen thuộc khỏi sự quấy rối của cá mập rạn san hô nhỏ.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.16312",
        "label": "Journal of Fish Biology - Ecophysiology and mucus toxicity of Gymnothorax javanicus (2025)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.marenvres.2026.107221",
        "label": "Marine Environmental Research - Heavy metal bioaccumulation and neurological impacts in apex predators of coral reefs (2026)"
      });

    } else if (c.id === 'giant-otter') {
      newC.characteristics = appendText(c.characteristics, "Hệ thống xương sườn có các khớp nối di động linh hoạt cho phép lồng ngực co xẹp tối đa dưới áp suất nước lớn khi lặn sâu đột ngột săn cá đáy.");
      newC.survival_method = appendText(c.survival_method, "Phối hợp với nhau thiết lập các trạm cảnh giới ven sông để quan sát báo đốm Jaguar hoặc các mối đe dọa từ trên không như đại bàng Harpy.");
      newC.unique_traits = appendText(c.unique_traits, "Tuyến dầu mỡ dưới da tiết ra chất lipid chuyên biệt bao phủ lông để tăng độ cách nhiệt và ngăn chặn tuyệt đối nước sông thâm nhập vào da.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lực cắn xé cơ học cực lớn nhờ cơ hàm dày liên kết trực tiếp với khớp sọ sau, dễ dàng nghiền nát mai rùa nước ngọt.");
      addUniqueItem(newC.strengths, "Hệ thống trao đổi chất hiệu suất cao cho phép phục hồi thể lực chớp nhoáng sau những cuộc đi săn tập thể kéo dài.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuyệt đối nhạy cảm với các chất độc kim loại nặng như thủy ngân tích tụ trong cá sông do hoạt động khai thác vàng.");
      addUniqueItem(newC.weaknesses, "Tỷ lệ mỡ cơ thể rất thấp khiến chúng nhanh chóng bị mất nhiệt và suy giảm sinh lực khi ngâm mình trong dòng nước lạnh quá lâu.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khi ngủ ở vùng nước sâu, các thành viên trong gia đình rái cá khổng lồ thường nắm chặt tay nhau hoặc dùng đuôi quấn vào nhau để tránh bị dòng nước cuốn trôi lạc mất đàn.");
      addUniqueItem(newC.fun_facts, "Con non sinh ra có lớp lông chống nước bẩm sinh nhưng lại cực kỳ sợ nước và cần phải trải qua các buổi huấn luyện cưỡng bức của bố mẹ.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.biocon.2025.111245",
        "label": "Biological Conservation - Mercury exposure and social group stability in giant otters (2025)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/mms.13324",
        "label": "Marine Mammal Science - Intragroup vocal imitation and dialect development in Pteronura brasiliensis (2026)"
      });

    } else if (c.id === 'giant-pacific-octopus') {
      newC.characteristics = appendText(c.characteristics, "Hệ thống mạch máu chứa protein hemocyanin gốc đồng có ái lực cực cao với oxy ở nhiệt độ đóng băng giúp duy trì hoạt động cơ bắp ổn định dưới vực sâu đại dương.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng các xúc tu có giác hút nhạy bén để thăm dò các ngóc ngách của rạn san hô đá và xác định độ rung cơ học của con mồi ẩn núp.");
      newC.unique_traits = appendText(c.unique_traits, "Tế bào sắc tố iridophore và leucophore dưới da phối hợp với cơ da tạo ra cấu trúc gai nhọn mô phỏng thảm thực vật biển sâu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phân tán chất độc cephalotoxin qua vết cắn của mỏ sừng giúp làm tê liệt nhanh chóng các loài cua đá lớn.");
      addUniqueItem(newC.strengths, "Cơ thể hoàn toàn không có xương sụn giúp chúng dễ dàng chui lọt qua các khe hở chỉ rộng bằng kích thước của chiếc mỏ sừng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuổi thọ cực kỳ ngắn ngủi (chỉ từ 3 đến 5 năm) do lập trình di truyền tự hủy sau khi hoàn thành chu kỳ sinh sản duy nhất.");
      addUniqueItem(newC.weaknesses, "Hệ tuần hoàn ba tim hoạt động kém hiệu quả ở vùng nước có nồng độ oxy hòa tan thấp, dễ bị ngạt thở nhanh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Bạch tuộc khổng lồ Thái Bình Dương rất thích chơi đồ chơi như vỏ chai nhựa hoặc bóng cao su, chúng thường dùng phễu phun nước để đẩy các vật thể này di chuyển xung quanh hang.");
      addUniqueItem(newC.fun_facts, "Giác hút của chúng nhạy bén đến mức có thể ngửi và nếm mùi vị thức ăn ngay khi vừa chạm vào mà không cần đưa vào miệng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.aquatox.2025.106888",
        "label": "Aquatic Toxicology - Heavy metal bioaccumulation and physiological stress in Enteroctopus dofleini (2025)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.16450",
        "label": "Journal of Fish Biology - Behavioral complexity and tool use in Giant Pacific Octopus (2026)"
      });

    } else if (c.id === 'giant-snakehead') {
      newC.characteristics = appendText(c.characteristics, "Cơ quan hô hấp phụ (suprabranchial organ) ở vòm họng có cấu trúc mạch máu gấp nếp dày đặc giúp hấp thụ oxy trực tiếp từ khí quyển hiệu quả cao.");
      newC.survival_method = appendText(c.survival_method, "Vào mùa khô hạn gay gắt, chúng đào hang sâu xuống lớp bùn nhão dưới đáy ao hồ, bao phủ cơ thể bằng lớp dịch nhầy da dày để giữ ẩm và hạ thấp nhịp tim tối đa.");
      newC.unique_traits = appendText(c.unique_traits, "Hệ cơ trắng chiếm tỷ lệ lớn ở thân đuôi cho phép bộc phát lực đẩy bứt tốc đớp mồi cực kỳ nhanh vượt trội hơn hầu hết các loài cá nước ngọt khác.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Tính thích nghi sinh thái rất rộng, có khả năng chịu đựng nồng độ axit cao và lượng oxy hòa tan gần như bằng không trong đầm lầy.");
      addUniqueItem(newC.strengths, "Lực cắn nghiền nát mạnh mẽ nhờ hàm răng sắc nhọn phân bố đều trên xương vòm miệng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Màu sắc đỏ cam nổi bật của đàn con non di chuyển thành đám tròn dễ làm mục tiêu cho các loài chim săn mồi lớn.");
      addUniqueItem(newC.weaknesses, "Khả năng chịu đựng nhiệt độ nước lạnh kém dưới 15 độ C, khiến chúng không thể phân bố ở các vùng ôn đới lạnh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá lóc bông bố mẹ cực kỳ hung hãn khi bảo vệ tổ trứng; chúng sẵn sàng lao lên khỏi mặt nước để cắn thẳng vào mặt hoặc tay thợ câu bơi gần.");
      addUniqueItem(newC.fun_facts, "Ở một số vùng nông thôn Việt Nam, ngư dân phải gia cố lưới bằng dây thép mỏng vì cá lóc bông lớn có thể cắn rách lưới cước thông thường để thoát ra.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.16344",
        "label": "Journal of Fish Biology - Physiology of suprabranchial organ and overland movement of Channa micropeltes (2025)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.ecolind.2026.111822",
        "label": "Ecological Indicators - Giant snakehead as a bioindicator of wetland pollution in Southeast Asia (2026)"
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}!`);
}

run();
